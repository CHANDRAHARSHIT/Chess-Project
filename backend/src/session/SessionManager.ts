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
} from "./types.js";

/**
 * Rules-blind game lifecycle orchestrator.
 * Single state owner of game session state machines, time authority, and move history.
 *
 * LIFECYCLE: CREATED → WAITING → READY → PLAYING → COMPLETED / ABANDONED
 */
export class SessionManager {
  private readonly sessions = new Map<string, GameSession>();

  constructor(
    private readonly onResult: ResultEmitter = () => {},
    private readonly variantResolver: (variantId: string) => VariantContract | undefined = (vId) =>
      variantRegistry.get(vId)
  ) {}

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

    emitTransition({
      domain: "session",
      from: "CREATED",
      to: "WAITING",
      context: { sessionId, matchId: descriptor.matchId, variantId: descriptor.variantId },
    });

    session.status = "WAITING";
    return session;
  }

  /**
   * Called when Transport confirms all participants have connected.
   * Transitions WAITING → READY. Clocks remain stopped.
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
      session.clock = {
        remainingMs: session.clock.remainingMs,
        lastMoveAt: now,
      };
    } else {
      // PLAYING state: deduct elapsed time and add increment
      const lastMoveAt = session.clock.lastMoveAt ?? now;
      const elapsed = Math.max(0, now - lastMoveAt);
      const incMs = session.matchDescriptor.timeControl.incrementSeconds * 1000;

      const updatedRemaining = [...session.clock.remainingMs];
      updatedRemaining[sideIndex] = Math.max(0, updatedRemaining[sideIndex] - elapsed + incMs);

      session.clock = {
        remainingMs: updatedRemaining,
        lastMoveAt: now,
      };
    }

    // Apply move and update state
    const nextState = session.variant.applyMove(session.currentState, move);
    session.currentState = nextState;
    session.moveHistory = [...session.moveHistory, move];

    // Check for terminal state
    if (session.variant.isTerminal(nextState)) {
      this.handleTerminal(session, nextState);
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

    emitTransition({
      domain: "session",
      from: oldStatus,
      to: "ABANDONED",
      context: { sessionId, matchId: session.matchDescriptor.matchId, forfeitUserId: userId },
    });

    // Fire-and-forget Result emission
    try {
      this.onResult(result);
    } catch (err) {
      reportError({ domain: "session", error: err, fatal: false, context: { sessionId } });
    }
  }

  /**
   * Advances game clocks by elapsedMs.
   * No-op on sessions not in PLAYING state.
   * Triggers clock timeout -> COMPLETED when remainingMs reaches 0.
   */
  tickClocks(elapsedMs: number): void {
    const now = Date.now();

    for (const session of this.sessions.values()) {
      if (session.status !== "PLAYING") {
        continue; // Clocks do not run during CREATED, WAITING, READY, COMPLETED, ABANDONED
      }

      const turnSide = this.getTurnSideIndex(session);
      const remaining = [...session.clock.remainingMs];
      remaining[turnSide] = Math.max(0, remaining[turnSide] - elapsedMs);

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

        session.status = "COMPLETED";

        emitTransition({
          domain: "session",
          from: "PLAYING",
          to: "COMPLETED",
          context: { sessionId: session.sessionId, matchId: session.matchDescriptor.matchId, reason: "timeout", losingSide: turnSide },
        });

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

    emitTransition({
      domain: "session",
      from: "PLAYING",
      to: "COMPLETED",
      context: { sessionId: session.sessionId, matchId: session.matchDescriptor.matchId, reason: terminationReason },
    });

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
}
