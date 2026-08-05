import crypto from "crypto";
import type { MatchDescriptor } from "../contracts/index.js";
import { emitTransition, reportError } from "../observability/index.js";
import type { MatchTicket } from "./types.js";

const DEFAULT_TICKET_TTL_MS = 60_000; // 1 minute
const MATCHED_RETENTION_MS = 300_000; // 5 minutes retention for polling

/**
 * Pure in-memory FCFS ticket queue.
 * Single state owner of queue tickets and matching logic.
 */
export class MatchmakingQueue {
  private readonly tickets = new Map<string, MatchTicket>();
  // O(1) user -> ticketId lookup for active WAITING/MATCHED tickets
  private readonly userTickets = new Map<string, string>();
  // Listeners notified synchronously whenever tryPair() produces a MatchDescriptor
  // (mirrors ConnectionManager.onConnectionEvent). Matchmaking stays unaware of what
  // a listener does with the descriptor — it only knows a match was produced.
  private readonly matchHandlers: Array<(descriptor: MatchDescriptor) => void> = [];

  constructor(private readonly ticketTtlMs: number = DEFAULT_TICKET_TTL_MS) {}

  /**
   * Registers a listener invoked synchronously whenever tryPair() successfully pairs
   * two tickets — regardless of whether tryPair() was triggered by enqueue() or by
   * the ExpiryTicker's periodic sweep. This is the sole seam Matchmaking exposes to
   * any consumer; Matchmaking has no knowledge of what a listener does with the
   * descriptor (session creation, compensation, etc. are the listener's concern).
   */
  onMatch(handler: (descriptor: MatchDescriptor) => void): void {
    this.matchHandlers.push(handler);
  }

  private emitMatch(descriptor: MatchDescriptor): void {
    for (const handler of this.matchHandlers) handler(descriptor);
  }

  /**
   * Enqueues a user into the FCFS queue.
   * Idempotent: if user has an active WAITING or MATCHED ticket, returns it.
   * Calls tryPair() internally and returns ticket + optional descriptor.
   */
  enqueue(
    userId: string,
    variantId: string
  ): { ticket: MatchTicket; descriptor: MatchDescriptor | null } {
    // Idempotency check: if user is already queued or matched.
    // Routed through getTicket() (not a raw map read) so a WAITING ticket that's already
    // past its expiresAt is lazily expired here rather than handed back as if still active.
    const existingTicketId = this.userTickets.get(userId);
    if (existingTicketId) {
      const existing = this.getTicket(existingTicketId);
      if (existing && (existing.status === "WAITING" || existing.status === "MATCHED")) {
        return { ticket: existing, descriptor: existing.descriptor ?? null };
      }
    }

    const now = Date.now();
    const ticketId = crypto.randomUUID();

    const ticket: MatchTicket = {
      ticketId,
      userId,
      variantId,
      enqueuedAt: now,
      expiresAt: now + this.ticketTtlMs,
      matchedAt: null,
      status: "WAITING",
    };

    this.tickets.set(ticketId, ticket);
    this.userTickets.set(userId, ticketId);

    emitTransition({
      domain: "matchmaking",
      from: "NONE",
      to: "WAITING",
      context: { ticketId, userId, variantId },
    });

    // tryPair() may synchronously pair this ticket AND synchronously trigger
    // downstream session creation via emitMatch() — which, on failure, compensates
    // by resetting the ticket back to WAITING before tryPair() even returns. Re-read
    // the ticket's live state afterward rather than trusting tryPair()'s return value,
    // so the caller never reports a "matched" ticket that was already compensated away.
    this.tryPair();
    const finalTicket = this.tickets.get(ticketId) ?? ticket;
    const descriptor = finalTicket.status === "MATCHED" ? finalTicket.descriptor ?? null : null;
    return { ticket: finalTicket, descriptor };
  }

  /**
   * Cancels a WAITING ticket.
   * Enforces ownership: ticket.userId === userId.
   * Deletes ticket from map immediately upon cancellation.
   */
  cancel(ticketId: string, userId: string): void {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      const err = new Error(`Ticket '${ticketId}' not found.`);
      reportError({ domain: "matchmaking", error: err, fatal: false, context: { ticketId, userId } });
      throw err;
    }

    if (ticket.userId !== userId) {
      const err = new Error(`Unauthorized: User '${userId}' does not own ticket '${ticketId}'.`);
      reportError({ domain: "matchmaking", error: err, fatal: false, context: { ticketId, userId } });
      throw err;
    }

    if (ticket.status !== "WAITING") {
      const err = new Error(`Cannot cancel ticket in '${ticket.status}' state.`);
      reportError({ domain: "matchmaking", error: err, fatal: false, context: { ticketId, userId } });
      throw err;
    }

    ticket.status = "CANCELLED";

    emitTransition({
      domain: "matchmaking",
      from: "WAITING",
      to: "CANCELLED",
      context: { ticketId, userId },
    });

    // Delete immediately on cancellation (map hygiene)
    this.tickets.delete(ticketId);
    this.userTickets.delete(userId);
  }

  /**
   * Pairs the first two WAITING tickets with the same variantId in FIFO order.
   * Emits an immutable MatchDescriptor and updates both tickets to MATCHED.
   */
  tryPair(): MatchDescriptor | null {
    // Find all WAITING tickets grouped by variantId
    const waitingByVariant = new Map<string, MatchTicket[]>();
    for (const ticket of this.tickets.values()) {
      if (ticket.status === "WAITING") {
        const list = waitingByVariant.get(ticket.variantId) ?? [];
        list.push(ticket);
        waitingByVariant.set(ticket.variantId, list);
      }
    }

    for (const [variantId, list] of waitingByVariant.entries()) {
      if (list.length >= 2) {
        // Sort by enqueuedAt ascending (FIFO)
        list.sort((a, b) => a.enqueuedAt - b.enqueuedAt);
        const [t1, t2] = [list[0], list[1]];

        const now = Date.now();
        const matchId = crypto.randomUUID();

        // Random side assignment (0 = White, 1 = Black)
        const side0First = crypto.randomInt(0, 2) === 0;
        const p1Side = side0First ? 0 : 1;
        const p2Side = side0First ? 1 : 0;

        // Generate positionId 0..959 for Chess960
        const positionId = crypto.randomInt(0, 960);

        const descriptor: MatchDescriptor = {
          matchId,
          participants: [
            { userId: t1.userId, side: p1Side },
            { userId: t2.userId, side: p2Side },
          ],
          cardinality: { sides: 2, perSide: 1 },
          variantId,
          variantParams: { positionId },
          timeControl: { initialSeconds: 300, incrementSeconds: 3, label: "5+3 Blitz" },
          rated: false,
          provenance: "queue",
          createdAt: new Date(now).toISOString(),
        };

        // Transition both tickets to MATCHED
        t1.status = "MATCHED";
        t1.matchedAt = now;
        t1.descriptor = descriptor;

        t2.status = "MATCHED";
        t2.matchedAt = now;
        t2.descriptor = descriptor;

        emitTransition({
          domain: "matchmaking",
          from: "WAITING",
          to: "MATCHED",
          context: { ticketId: t1.ticketId, userId: t1.userId, matchId },
        });

        emitTransition({
          domain: "matchmaking",
          from: "WAITING",
          to: "MATCHED",
          context: { ticketId: t2.ticketId, userId: t2.userId, matchId },
        });

        // Fires the seam synchronously. A registered listener (the session bridge)
        // may call back into compensateFailedMatch() before this returns — see enqueue().
        this.emitMatch(descriptor);

        return descriptor;
      }
    }

    return null;
  }

  /**
   * Reverts a failed match: both tickets belonging to descriptor.matchId are restored
   * to WAITING with a fresh enqueuedAt/expiresAt, so the normal FCFS flow can re-attempt
   * pairing them (with each other or with anyone else already queued).
   *
   * Called by a downstream listener (the session bridge) when session creation fails
   * after tickets were already consumed — the "ticket-consumed-but-session-failed"
   * compensation path (Phase 3.2 Error Contract: "Matchmaking compensates (refund tickets)").
   *
   * Safe no-op for any ticket that no longer exists or was independently cancelled/expired
   * in the meantime (readable as: nothing left to compensate for that participant).
   */
  compensateFailedMatch(descriptor: MatchDescriptor): void {
    const now = Date.now();

    for (const participant of descriptor.participants) {
      const ticketId = this.userTickets.get(participant.userId);
      if (!ticketId) continue;

      const ticket = this.tickets.get(ticketId);
      if (!ticket || ticket.status !== "MATCHED" || ticket.descriptor?.matchId !== descriptor.matchId) {
        continue;
      }

      const refunded: MatchTicket = {
        ticketId: ticket.ticketId,
        userId: ticket.userId,
        variantId: ticket.variantId,
        enqueuedAt: now,
        expiresAt: now + this.ticketTtlMs,
        matchedAt: null,
        status: "WAITING",
      };

      this.tickets.set(ticketId, refunded);

      emitTransition({
        domain: "matchmaking",
        from: "MATCHED",
        to: "WAITING",
        context: { ticketId, userId: ticket.userId, matchId: descriptor.matchId, reason: "session_creation_failed" },
      });
    }
  }

  /**
   * Marks a single WAITING ticket EXPIRED and deletes it immediately. Shared by expireStale()'s
   * periodic sweep and getTicket()'s lazy, read-time check, so both paths expire a ticket
   * identically (same emitTransition, same map cleanup) instead of drifting apart.
   */
  private expireTicket(ticket: MatchTicket): void {
    ticket.status = "EXPIRED";

    emitTransition({
      domain: "matchmaking",
      from: "WAITING",
      to: "EXPIRED",
      context: { ticketId: ticket.ticketId, userId: ticket.userId },
    });

    this.tickets.delete(ticket.ticketId);
    this.userTickets.delete(ticket.userId);
  }

  /**
   * Marks WAITING tickets past expiresAt as EXPIRED and deletes them immediately.
   * Covers tickets nobody is actively polling (e.g. a closed tab) — getTicket() covers the
   * common case (an active poller) immediately instead of waiting for this sweep.
   */
  expireStale(): void {
    const now = Date.now();
    for (const ticket of Array.from(this.tickets.values())) {
      if (ticket.status === "WAITING" && now > ticket.expiresAt) {
        this.expireTicket(ticket);
      }
    }
  }

  /**
   * Prunes MATCHED tickets that have passed the retention window.
   */
  pruneMatched(): void {
    const now = Date.now();
    for (const [ticketId, ticket] of Array.from(this.tickets.entries())) {
      if (ticket.status === "MATCHED" && ticket.matchedAt && now > ticket.matchedAt + MATCHED_RETENTION_MS) {
        this.tickets.delete(ticketId);
        this.userTickets.delete(ticket.userId);
      }
    }
  }

  /**
   * Retrieves a ticket by ticketId, lazily expiring it first if it's WAITING and past
   * expiresAt. Without this, a WAITING ticket only expires when the 30s ExpiryTicker sweep
   * happens to run, so a client polling GET /queue/:ticketId right after its own countdown
   * hits 0:00 could still see "WAITING" for up to ~30s longer — this makes expiry consistent
   * with the deadline itself, independent of the periodic sweep's timing.
   */
  getTicket(ticketId: string): MatchTicket | undefined {
    const ticket = this.tickets.get(ticketId);
    if (ticket && ticket.status === "WAITING" && Date.now() > ticket.expiresAt) {
      this.expireTicket(ticket);
      return undefined;
    }
    return ticket;
  }
}

/** Singleton queue instance */
export const matchmakingQueue = new MatchmakingQueue();
