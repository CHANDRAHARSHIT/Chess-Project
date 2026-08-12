import crypto from "crypto";
import type {
  MatchDescriptor,
  VariantContract,
  Move,
  MoveValidationResult,
  GameResult,
  TerminationReason,
} from "../contracts/index.js";
import { variantRegistry } from "../variant/index.js";
import { emitTransition, reportError } from "../observability/index.js";
import type {
  GameSession,
  SessionStatus,
  SessionClock,
  ResultEmitter,
  SessionTransport,
} from "./types.js";
import { noOpSessionTransport } from "./types.js";

/** Grace/timeout durations, overridable for tests (mirrors MatchmakingQueue's ticketTtlMs pattern). */
export interface SessionTimings {
  readonly participantGraceMs?: number; // one participant disconnected, other(s) remain
  readonly pauseGraceMs?: number;       // all participants disconnected (PAUSED)
  readonly waitTimeoutMs?: number;      // WAITING no-show
  readonly matchStartGraceMs?: number;  // READY: clock stays frozen until the client's countdown finishes
}

/**
 * Rules-blind game lifecycle orchestrator.
 * Single state owner of game session state machines, time authority, and move history.
 *
 * LIFECYCLE: CREATED → WAITING → READY → PLAYING → (PAUSED ↔ PLAYING) → COMPLETED / ABANDONED
 * PAUSED added under M1-AM-01 — see types.ts SessionStatus for rationale.
 */
export class SessionManager {
  private readonly participantGraceMs: number;
  private readonly pauseGraceMs: number;
  private readonly waitTimeoutMs: number;
  private readonly matchStartGraceMs: number;

  private readonly sessions = new Map<string, GameSession>();

  // Runtime-only bookkeeping (never persisted/reconstructed — presence and timers die with the process).
  private readonly presence = new Map<string, Set<string>>();               // sessionId -> connected userIds
  private readonly participantGraceTimers = new Map<string, Map<string, NodeJS.Timeout>>(); // sessionId -> userId -> timer
  private readonly pauseGraceTimers = new Map<string, NodeJS.Timeout>();     // sessionId -> timer
  private readonly waitTimers = new Map<string, NodeJS.Timeout>();          // sessionId -> timer
  private readonly userToSession = new Map<string, string>();               // userId -> sessionId
  private readonly graceRemaining = new Map<string, number>();              // sessionId -> ms left of match-start grace

  constructor(
    private readonly onResult: ResultEmitter = () => {},
    private readonly variantResolver: (variantId: string) => VariantContract | undefined = (vId) =>
      variantRegistry.get(vId),
    private readonly transport: SessionTransport = noOpSessionTransport,
    timings: SessionTimings = {}
  ) {
    this.participantGraceMs = timings.participantGraceMs ?? 30_000;
    this.pauseGraceMs = timings.pauseGraceMs ?? 60_000;
    this.waitTimeoutMs = timings.waitTimeoutMs ?? 60_000;
    // Matches the frontend's "3…2…1…PLAY!" match-sync countdown (4 one-second ticks) plus a
    // small margin for network latency, so the authoritative clock can never go live before the
    // countdown overlay has visibly finished on the client.
    this.matchStartGraceMs = timings.matchStartGraceMs ?? 4_500;
  }

  /**
   * Initializes a new GameSession from a MatchDescriptor.
   * Session is CREATED then immediately enters WAITING state.
   * Clocks are initialized but stopped.
   */
  createSession(descriptor: MatchDescriptor): GameSession {
    const sessionId = crypto.randomUUID();

    const variant = this.variantResolver(descriptor.variantId);
    if (!variant) {
      const err = new Error(`Variant '${descriptor.variantId}' not found in registry.`);
      reportError({
        domain: "session",
        error: err,
        fatal: true,
        context: { matchId: descriptor.matchId, variantId: descriptor.variantId },
      });
      throw err;
    }

    const initialState = variant.initialState(descriptor.variantParams);

    const initialMs = descriptor.timeControl.initialSeconds * 1000;
    const cardinality = descriptor.cardinality;
    const remainingMs = new Array<number>(cardinality.sides).fill(initialMs);

    const clock: SessionClock = {
      remainingMs,
      lastMoveAt: null,
    };

    const session: GameSession = {
      sessionId,
      matchDescriptor: descriptor,
      status: "CREATED",
      variant,
      clock,
      moveHistory: [],
      currentState: initialState,
      resultEmitted: false,
      createdAt: Date.now(),
      startedAt: null,
    };

    this.sessions.set(sessionId, session);

    for (const p of descriptor.participants) {
      this.userToSession.set(p.userId, sessionId);
    }
    this.presence.set(sessionId, new Set());

    emitTransition({
      domain: "session",
      from: "CREATED",
      to: "WAITING",
      context: { sessionId, matchId: descriptor.matchId, variantId: descriptor.variantId },
    });

    session.status = "WAITING";
    this.startWaitTimer(sessionId);
    return session;
  }

  /**
   * Called when Transport confirms all participants have connected.
   * Transitions WAITING → READY.
   *
   * M6 fix: the clock for the side to move first now starts ticking here, at game start,
   * instead of staying frozen until that side's first move lands. Previously a player could
   * bank unlimited free thinking time before their first move (e.g. sit idle for 10 minutes
   * with a 5-minute clock and still have the full 5:00 when they finally moved) at the direct
   * expense of fairness to their opponent — standard chess clock behavior charges the mover
   * from the moment the game is ready to begin, not from their first move.
   *
   * M6 amendment: the clock doesn't go live immediately — it stays frozen (lastMoveAt null)
   * for `matchStartGraceMs`, consumed by tickClocks(), so it can never tick underneath the
   * client's own "3…2…1…PLAY!" match-sync countdown. This is a fixed, equal delay for both
   * sides, so it doesn't reopen the free-thinking-time exploit the fix above closed.
   * Idempotent: no-op if session is already READY or beyond.
   */
  notifyAllPresent(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      reportError({
        domain: "session",
        error: new Error(`notifyAllPresent called for non-existent session ${sessionId}`),
        fatal: false,
        context: { sessionId },
      });
      return;
    }

    if (session.status !== "WAITING") {
      return; // Idempotent no-op
    }

    emitTransition({
      domain: "session",
      from: "WAITING",
      to: "READY",
      context: { sessionId, matchId: session.matchDescriptor.matchId },
    });

    session.status = "READY";
    if (this.matchStartGraceMs > 0) {
      this.graceRemaining.set(sessionId, this.matchStartGraceMs);
    } else {
      session.clock = { remainingMs: session.clock.remainingMs, lastMoveAt: Date.now() };
    }
    this.clearWaitTimer(sessionId);
    this.broadcastState(session);
  }

  /**
   * Submits a move on behalf of an authenticated participant.
   * Validates turn ownership, move legality via Variant, applies state update,
   * updates clocks, checks terminal status, and emits GameResult if terminal.
   */
  submitMove(sessionId: string, userId: string, move: Move): MoveValidationResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { legal: false, reason: "Session not found." };
    }

    if (session.status !== "READY" && session.status !== "PLAYING") {
      return { legal: false, reason: `Cannot submit move in '${session.status}' state.` };
    }

    // Identify side assignment for userId
    const assignment = session.matchDescriptor.participants.find((p) => p.userId === userId);
    if (!assignment) {
      return { legal: false, reason: `User '${userId}' is not a participant in session.` };
    }

    const sideIndex = assignment.side;

    // Validate turn order (standard turn: side 0 moves first, then alternating)
    const turnSide = this.getTurnSideIndex(session);
    if (sideIndex !== turnSide) {
      return { legal: false, reason: `Not side ${sideIndex}'s turn. Current turn: side ${turnSide}.` };
    }

    // Ask Variant for move validation (sole rules authority)
    const validation = session.variant.validateMove(session.currentState, move, sideIndex);
    if (!validation.legal) {
      return validation;
    }

    const now = Date.now();

    // M6 fix: elapsed time for the mover's side is no longer deducted here. tickClocks()
    // (driven by ClockTicker every 100ms, real wall-clock elapsed) is now the single source of
    // truth for decrementing a running clock — it already ran continuously for this side's turn
    // for the entire READY/PLAYING window since their side became the one to move. Deducting
    // `now - lastMoveAt` again here on top of that double-charged the same span (the visible
    // clock after each move reflected roughly 2x the real time spent, minus increment). This
    // only credits the increment and resets the anchor that both tickClocks() and the frontend's
    // SideClock use going forward.
    // A move landing during the match-start grace (e.g. it elapses mid-flight) makes the grace
    // moot — the clock is live as of `now` below regardless, so any leftover countdown must not
    // linger and freeze a later tick.
    this.graceRemaining.delete(sessionId);

    const incMs = session.matchDescriptor.timeControl.incrementSeconds * 1000;
    const updatedRemaining = [...session.clock.remainingMs];
    updatedRemaining[sideIndex] = Math.max(0, updatedRemaining[sideIndex] + incMs);
    session.clock = {
      remainingMs: updatedRemaining,
      lastMoveAt: now,
    };

    // READY → PLAYING on first valid move
    if (session.status === "READY") {
      emitTransition({
        domain: "session",
        from: "READY",
        to: "PLAYING",
        context: { sessionId, matchId: session.matchDescriptor.matchId, firstMoveBy: userId },
      });
      session.status = "PLAYING";
      session.startedAt = now;
    }

    // Apply move and update state
    const nextState = session.variant.applyMove(session.currentState, move);
    session.currentState = nextState;
    session.moveHistory = [...session.moveHistory, move];

    // Check for terminal state
    if (session.variant.isTerminal(nextState)) {
      this.handleTerminal(session, nextState);
    } else {
      this.broadcastState(session);
    }

    return { legal: true };
  }

  /**
   * Participant forfeits the game.
   * Transitions session to ABANDONED and emits GameResult with reason "forfeit".
   */
  forfeit(sessionId: string, userId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      reportError({
        domain: "session",
        error: new Error(`forfeit called for non-existent session ${sessionId}`),
        fatal: false,
        context: { sessionId },
      });
      return;
    }

    if (session.status === "COMPLETED" || session.status === "ABANDONED") {
      return; // Already in terminal absorbing state
    }

    const participant = session.matchDescriptor.participants.find((p) => p.userId === userId);
    if (!participant) {
      const err = new Error(`User '${userId}' is not a participant in session ${sessionId}.`);
      reportError({ domain: "session", error: err, fatal: false, context: { sessionId, userId } });
      return;
    }

    if (session.resultEmitted) {
      return; // Guard against race conditions
    }

    session.resultEmitted = true;
    const forfeitingSide = participant.side;
    const winningSide = forfeitingSide === 0 ? 1 : 0;

    const result: GameResult = {
      gameSessionId: session.sessionId,
      matchId: session.matchDescriptor.matchId,
      terminationReason: "forfeit",
      outcome: { kind: "win", winningSide },
      participants: session.matchDescriptor.participants.map((p) => ({ userId: p.userId, side: p.side })),
      variantId: session.matchDescriptor.variantId,
      rated: session.matchDescriptor.rated,
      provenance: session.matchDescriptor.provenance,
      endedAt: new Date().toISOString(),
      moveCount: session.moveHistory.length,
      moveHistory: session.moveHistory,
      timeControl: session.matchDescriptor.timeControl,
      durationSeconds: session.startedAt ? Math.round((Date.now() - session.startedAt) / 1000) : 0,
      ...(session.matchDescriptor.ratingPoolId ? { ratingPoolId: session.matchDescriptor.ratingPoolId } : {}),
      ...(session.matchDescriptor.tournamentContext ? { tournamentContext: session.matchDescriptor.tournamentContext } : {}),
      ...(session.matchDescriptor.metadata ? { metadata: session.matchDescriptor.metadata } : {}),
    };

    const oldStatus = session.status;
    session.status = "ABANDONED";
    this.cleanupSession(session);

    emitTransition({
      domain: "session",
      from: oldStatus,
      to: "ABANDONED",
      context: { sessionId, matchId: session.matchDescriptor.matchId, forfeitUserId: userId },
    });

    this.broadcastGameOver(session, result);

    // Fire-and-forget Result emission
    try {
      this.onResult(result);
    } catch (err) {
      reportError({ domain: "session", error: err, fatal: false, context: { sessionId } });
    }
  }

  /**
   * Advances game clocks by elapsedMs.
   * No-op on sessions not in READY or PLAYING state.
   * Triggers clock timeout -> COMPLETED when remainingMs reaches 0.
   *
   * M6 fix: also runs during READY (not just PLAYING) so the side to move first is charged
   * time from game start, matching notifyAllPresent()'s clock-start change. This is the sole
   * mechanism that decrements a side's remaining time in real time — submitMove() only credits
   * increment and resets the anchor (see its M6 comment) to avoid double-charging the same span.
   *
   * M6 amendment: also the sole place that consumes a session's match-start grace (see
   * notifyAllPresent()) — while grace remains, the elapsed span is absorbed into the countdown
   * instead of the clock, so remainingMs/lastMoveAt stay untouched (frozen) until it runs out.
   */
  tickClocks(elapsedMs: number): void {
    const now = Date.now();

    for (const session of this.sessions.values()) {
      if (session.status !== "PLAYING" && session.status !== "READY") {
        continue; // Clocks do not run during CREATED, WAITING, PAUSED, COMPLETED, ABANDONED
      }

      let effectiveElapsed = elapsedMs;
      const grace = this.graceRemaining.get(session.sessionId);
      if (grace !== undefined) {
        const remainingGrace = grace - elapsedMs;
        if (remainingGrace > 0) {
          this.graceRemaining.set(session.sessionId, remainingGrace);
          continue; // Still inside the match-start countdown — clock stays frozen.
        }
        // Grace just ran out this tick: activate the clock anchor, charge only the overshoot.
        this.graceRemaining.delete(session.sessionId);
        session.clock = { remainingMs: session.clock.remainingMs, lastMoveAt: now };
        this.broadcastState(session);
        effectiveElapsed = -remainingGrace;
        if (effectiveElapsed <= 0) continue;
      }

      const turnSide = this.getTurnSideIndex(session);
      const remaining = [...session.clock.remainingMs];
      remaining[turnSide] = Math.max(0, remaining[turnSide] - effectiveElapsed);

      session.clock = {
        remainingMs: remaining,
        lastMoveAt: session.clock.lastMoveAt,
      };

      if (remaining[turnSide] === 0) {
        if (session.resultEmitted) {
          continue; // Guard against race conditions
        }

        session.resultEmitted = true;
        const winningSide = turnSide === 0 ? 1 : 0;

        const result: GameResult = {
          gameSessionId: session.sessionId,
          matchId: session.matchDescriptor.matchId,
          terminationReason: "timeout",
          outcome: { kind: "win", winningSide },
          participants: session.matchDescriptor.participants.map((p) => ({ userId: p.userId, side: p.side })),
          variantId: session.matchDescriptor.variantId,
          rated: session.matchDescriptor.rated,
          provenance: session.matchDescriptor.provenance,
          endedAt: new Date(now).toISOString(),
          moveCount: session.moveHistory.length,
          moveHistory: session.moveHistory,
          timeControl: session.matchDescriptor.timeControl,
          durationSeconds: session.startedAt ? Math.round((now - session.startedAt) / 1000) : 0,
          ...(session.matchDescriptor.ratingPoolId ? { ratingPoolId: session.matchDescriptor.ratingPoolId } : {}),
          ...(session.matchDescriptor.tournamentContext ? { tournamentContext: session.matchDescriptor.tournamentContext } : {}),
          ...(session.matchDescriptor.metadata ? { metadata: session.matchDescriptor.metadata } : {}),
        };

        const oldStatus = session.status;
        session.status = "COMPLETED";
        this.cleanupSession(session);

        emitTransition({
          domain: "session",
          from: oldStatus,
          to: "COMPLETED",
          context: { sessionId: session.sessionId, matchId: session.matchDescriptor.matchId, reason: "timeout", losingSide: turnSide },
        });

        this.broadcastGameOver(session, result);

        try {
          this.onResult(result);
        } catch (err) {
          reportError({ domain: "session", error: err, fatal: false, context: { sessionId: session.sessionId } });
        }
      }
    }
  }

  /** Gets a session by ID */
  getSession(sessionId: string): GameSession | undefined {
    return this.sessions.get(sessionId);
  }

  /** Handles terminal outcome from Variant */
  private handleTerminal(session: GameSession, terminalState: unknown): void {
    if (session.resultEmitted) return;
    session.resultEmitted = true;

    const outcome = session.variant.getOutcome(terminalState as any);
    const terminationReason: TerminationReason =
      outcome.kind === "win"
        ? "checkmate"
        : outcome.reason === "stalemate"
        ? "stalemate"
        : "draw_agreement";

    const gameResultOutcome =
      outcome.kind === "win"
        ? { kind: "win" as const, winningSide: outcome.winningSide }
        : { kind: "draw" as const };

    const result: GameResult = {
      gameSessionId: session.sessionId,
      matchId: session.matchDescriptor.matchId,
      terminationReason,
      outcome: gameResultOutcome,
      participants: session.matchDescriptor.participants.map((p) => ({ userId: p.userId, side: p.side })),
      variantId: session.matchDescriptor.variantId,
      rated: session.matchDescriptor.rated,
      provenance: session.matchDescriptor.provenance,
      endedAt: new Date().toISOString(),
      moveCount: session.moveHistory.length,
      moveHistory: session.moveHistory,
      timeControl: session.matchDescriptor.timeControl,
      durationSeconds: session.startedAt ? Math.round((Date.now() - session.startedAt) / 1000) : 0,
      ...(session.matchDescriptor.ratingPoolId ? { ratingPoolId: session.matchDescriptor.ratingPoolId } : {}),
      ...(session.matchDescriptor.tournamentContext ? { tournamentContext: session.matchDescriptor.tournamentContext } : {}),
      ...(session.matchDescriptor.metadata ? { metadata: session.matchDescriptor.metadata } : {}),
    };

    session.status = "COMPLETED";
    this.cleanupSession(session);

    emitTransition({
      domain: "session",
      from: "PLAYING",
      to: "COMPLETED",
      context: { sessionId: session.sessionId, matchId: session.matchDescriptor.matchId, reason: terminationReason },
    });

    this.broadcastGameOver(session, result);

    try {
      this.onResult(result);
    } catch (err) {
      reportError({ domain: "session", error: err, fatal: false, context: { sessionId: session.sessionId } });
    }
  }

  /** Derives side index whose turn it currently is based on move history count */
  private getTurnSideIndex(session: GameSession): number {
    const card = session.variant.getCardinality(session.matchDescriptor.variantParams);
    const turnOrder = card.turnOrder;
    return turnOrder[session.moveHistory.length % turnOrder.length];
  }

  // ───────────────────────────────────────────────────────────────────────────
  // M2 additions: presence interpretation, grace timers, PAUSED, broadcasts.
  // Runtime-only bookkeeping — nothing here is persisted or reconstructed (M6 concern).
  // ───────────────────────────────────────────────────────────────────────────

  /** Returns the sessionId a participant currently belongs to, if any. */
  getSessionIdForParticipant(userId: string): string | undefined {
    return this.userToSession.get(userId);
  }

  /**
   * Called when Transport reports a participant's wire connection came up.
   * Session decides what it means: complete a WAITING roster, resume from PAUSED,
   * or simply clear that participant's grace timer while PLAYING continues.
   */
  notifyParticipantConnected(sessionId: string, userId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const present = this.presence.get(sessionId) ?? new Set<string>();

    // Bootstrap: broadcastPresence() below only reaches sockets that are already registered —
    // ConnectionManager.send() silently no-ops for anyone not yet connected (see its `if
    // (!connId) return`). So whichever participant connects first has their "connected" fact
    // dropped for a peer who hasn't connected yet, and that peer never learns it later since no
    // further connect event fires for the first participant. Directly send the just-connected
    // participant a presence fact for everyone already present, so both directions are covered
    // regardless of connection order.
    for (const p of session.matchDescriptor.participants) {
      if (p.userId !== userId && present.has(p.userId)) {
        this.transport.send(userId, { type: "presence_update", payload: { userId: p.userId, connected: true } });
      }
    }

    present.add(userId);
    this.presence.set(sessionId, present);
    this.broadcastPresence(session, userId, true);

    if (session.status === "WAITING") {
      const allPresent = session.matchDescriptor.participants.every((p) => present.has(p.userId));
      if (allPresent) {
        this.notifyAllPresent(sessionId);
      } else {
        // Nothing has ever been broadcast for a WAITING session (createSession() doesn't send
        // anything, and the READY broadcast hasn't happened yet) — without this, the just-connected
        // participant's client has zero session state until the opponent shows up, and renders
        // neither a "waiting for opponent" message nor an error: it just looks frozen/broken.
        this.transport.send(userId, {
          type: "state_update",
          payload: { state: session.currentState, clock: session.clock, status: session.status },
        });
      }
      return;
    }

    if (session.status === "PLAYING") {
      this.clearParticipantGrace(sessionId, userId);
      // M6 fix: ConnectionManager.send() silently no-ops for a disconnected user (their
      // ConnectionId is removed from userIndex on disconnect — see ConnectionManager.disconnect()),
      // so ReconnectBuffer never actually buffers anything addressed to them while they're offline;
      // there is nothing for markReconnected()'s replay to replay. Without this, a participant who
      // reconnects mid-PLAYING while their opponent moved during the gap would never learn about
      // that move at all. Send them a fresh, authoritative snapshot directly (not a broadcast —
      // the opponent already has the current state).
      this.transport.send(userId, {
        type: "state_update",
        payload: { state: session.currentState, clock: session.clock, status: session.status },
      });
      return;
    }

    if (session.status === "PAUSED") {
      this.clearPauseGrace(sessionId);
      const oldStatus = session.status;
      session.status = "PLAYING";
      // Resume without charging the paused wall-clock time to whoever's turn it is.
      session.clock = { remainingMs: session.clock.remainingMs, lastMoveAt: Date.now() };

      emitTransition({
        domain: "session",
        from: oldStatus,
        to: "PLAYING",
        context: { sessionId, matchId: session.matchDescriptor.matchId, reconnectedUserId: userId },
      });

      this.broadcastState(session);
    }
  }

  /**
   * Called when Transport reports a participant's wire connection dropped.
   * WAITING: ignored — the WAITING no-show timer already covers this.
   * READY/PLAYING with someone still present: per-participant grace, expiring into the
   *   existing forfeit() path unchanged.
   * PLAYING with nobody present: PAUSED, with a global grace timer (M1-AM-01).
   */
  notifyParticipantDisconnected(sessionId: string, userId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    if (session.status !== "WAITING" && session.status !== "READY" && session.status !== "PLAYING") return;

    const present = this.presence.get(sessionId);
    present?.delete(userId);
    this.broadcastPresence(session, userId, false);

    if (session.status === "WAITING") return;

    const stillPresent = (present?.size ?? 0) > 0;

    if (session.status === "PLAYING" && !stillPresent) {
      // The global pause grace supersedes any per-participant timer already counting down
      // from an earlier, now-superseded single disconnect.
      this.clearAllParticipantGrace(sessionId);

      const oldStatus = session.status;
      session.status = "PAUSED";

      emitTransition({
        domain: "session",
        from: oldStatus,
        to: "PAUSED",
        context: { sessionId, matchId: session.matchDescriptor.matchId },
      });

      const timer = setTimeout(() => this.handlePauseExpiry(sessionId), this.pauseGraceMs);
      this.pauseGraceTimers.set(sessionId, timer);
      return;
    }

    this.startParticipantGrace(sessionId, userId);
  }

  /** Per-participant grace: expiry reuses forfeit() unchanged. */
  private startParticipantGrace(sessionId: string, userId: string): void {
    let timers = this.participantGraceTimers.get(sessionId);
    if (!timers) {
      timers = new Map();
      this.participantGraceTimers.set(sessionId, timers);
    }
    if (timers.has(userId)) return; // already counting down

    const timer = setTimeout(() => {
      timers!.delete(userId);
      this.forfeit(sessionId, userId);
    }, this.participantGraceMs);
    timers.set(userId, timer);
  }

  private clearParticipantGrace(sessionId: string, userId: string): void {
    const timers = this.participantGraceTimers.get(sessionId);
    const timer = timers?.get(userId);
    if (timer) {
      clearTimeout(timer);
      timers!.delete(userId);
    }
  }

  private clearAllParticipantGrace(sessionId: string): void {
    const timers = this.participantGraceTimers.get(sessionId);
    if (timers) {
      for (const t of timers.values()) clearTimeout(t);
      this.participantGraceTimers.delete(sessionId);
    }
  }

  private clearPauseGrace(sessionId: string): void {
    const timer = this.pauseGraceTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.pauseGraceTimers.delete(sessionId);
    }
  }

  private startWaitTimer(sessionId: string): void {
    const timer = setTimeout(() => this.handleWaitTimeout(sessionId), this.waitTimeoutMs);
    this.waitTimers.set(sessionId, timer);
  }

  private clearWaitTimer(sessionId: string): void {
    const timer = this.waitTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.waitTimers.delete(sessionId);
    }
  }

  /** WAITING no-show: no GameResult — no meaningful gameplay occurred (see M2 plan §Recommendation 3). */
  private handleWaitTimeout(sessionId: string): void {
    this.waitTimers.delete(sessionId);
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== "WAITING") return;

    const oldStatus = session.status;
    session.status = "ABANDONED";
    this.cleanupSession(session);

    emitTransition({
      domain: "session",
      from: oldStatus,
      to: "ABANDONED",
      context: { sessionId, matchId: session.matchDescriptor.matchId, reason: "wait_timeout" },
    });
  }

  /**
   * Global PAUSED grace expiry (M1-AM-01 invariant): nobody reconnected in time.
   * Neither side is credited a win — recorded as a mutual forfeit/draw, the only
   * outcome the frozen GameResult contract permits without a winning side.
   */
  private handlePauseExpiry(sessionId: string): void {
    this.pauseGraceTimers.delete(sessionId);
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== "PAUSED") return;
    if (session.resultEmitted) return;
    session.resultEmitted = true;

    const result: GameResult = {
      gameSessionId: session.sessionId,
      matchId: session.matchDescriptor.matchId,
      terminationReason: "forfeit",
      outcome: { kind: "draw" },
      participants: session.matchDescriptor.participants.map((p) => ({ userId: p.userId, side: p.side })),
      variantId: session.matchDescriptor.variantId,
      rated: session.matchDescriptor.rated,
      provenance: session.matchDescriptor.provenance,
      endedAt: new Date().toISOString(),
      moveCount: session.moveHistory.length,
      moveHistory: session.moveHistory,
      timeControl: session.matchDescriptor.timeControl,
      durationSeconds: session.startedAt ? Math.round((Date.now() - session.startedAt) / 1000) : 0,
      ...(session.matchDescriptor.ratingPoolId ? { ratingPoolId: session.matchDescriptor.ratingPoolId } : {}),
      ...(session.matchDescriptor.tournamentContext ? { tournamentContext: session.matchDescriptor.tournamentContext } : {}),
      ...(session.matchDescriptor.metadata ? { metadata: session.matchDescriptor.metadata } : {}),
    };

    const oldStatus = session.status;
    session.status = "ABANDONED";
    this.cleanupSession(session);

    emitTransition({
      domain: "session",
      from: oldStatus,
      to: "ABANDONED",
      context: { sessionId, matchId: session.matchDescriptor.matchId, reason: "pause_grace_expired" },
    });

    this.broadcastGameOver(session, result);

    try {
      this.onResult(result);
    } catch (err) {
      reportError({ domain: "session", error: err, fatal: false, context: { sessionId } });
    }
  }

  /** Clears all runtime-only bookkeeping for a session that has reached a terminal state. */
  private cleanupSession(session: GameSession): void {
    for (const p of session.matchDescriptor.participants) {
      if (this.userToSession.get(p.userId) === session.sessionId) {
        this.userToSession.delete(p.userId);
      }
    }
    this.presence.delete(session.sessionId);
    this.clearWaitTimer(session.sessionId);

    const grace = this.participantGraceTimers.get(session.sessionId);
    if (grace) {
      for (const t of grace.values()) clearTimeout(t);
      this.participantGraceTimers.delete(session.sessionId);
    }
    this.clearPauseGrace(session.sessionId);
    this.graceRemaining.delete(session.sessionId);
  }

  private broadcastState(session: GameSession): void {
    const userIds = session.matchDescriptor.participants.map((p) => p.userId);
    this.transport.broadcast(userIds, {
      type: "state_update",
      payload: { state: session.currentState, clock: session.clock, status: session.status },
    });
  }

  private broadcastGameOver(session: GameSession, result: GameResult): void {
    const userIds = session.matchDescriptor.participants.map((p) => p.userId);
    this.transport.broadcast(userIds, { type: "game_over", payload: result });
  }

  /**
   * AM-03 (Backend Stabilization, pre-M5): broadcasts the wire-presence fact Session already
   * derives in notifyParticipantConnected/Disconnected. No new authority, no new state — this
   * exposes the same `presence` Set this class already owns, to the same participants
   * broadcastState/broadcastGameOver already reach. Payload is intentionally minimal (just the
   * userId and whether they're connected); Session's status/grace-timer semantics are not exposed,
   * only the presence fact itself. Uses the existing generic `{type, payload}` SessionTransport
   * shape — no change to the SessionTransport interface or any frozen contract.
   */
  private broadcastPresence(session: GameSession, userId: string, connected: boolean): void {
    const userIds = session.matchDescriptor.participants.map((p) => p.userId);
    this.transport.broadcast(userIds, {
      type: "presence_update",
      payload: { userId, connected },
    });
  }
}
