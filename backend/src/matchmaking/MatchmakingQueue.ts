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

  constructor(private readonly ticketTtlMs: number = DEFAULT_TICKET_TTL_MS) {}

  /**
   * Enqueues a user into the FCFS queue.
   * Idempotent: if user has an active WAITING or MATCHED ticket, returns it.
   * Calls tryPair() internally and returns ticket + optional descriptor.
   */
  enqueue(
    userId: string,
    variantId: string
  ): { ticket: MatchTicket; descriptor: MatchDescriptor | null } {
    // Idempotency check: if user is already queued or matched
    const existingTicketId = this.userTickets.get(userId);
    if (existingTicketId) {
      const existing = this.tickets.get(existingTicketId);
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

    const descriptor = this.tryPair();
    return { ticket, descriptor };
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

        return descriptor;
      }
    }

    return null;
  }

  /**
   * Marks WAITING tickets past expiresAt as EXPIRED and deletes them immediately.
   */
  expireStale(): void {
    const now = Date.now();
    for (const [ticketId, ticket] of Array.from(this.tickets.entries())) {
      if (ticket.status === "WAITING" && now > ticket.expiresAt) {
        ticket.status = "EXPIRED";

        emitTransition({
          domain: "matchmaking",
          from: "WAITING",
          to: "EXPIRED",
          context: { ticketId, userId: ticket.userId },
        });

        this.tickets.delete(ticketId);
        this.userTickets.delete(ticket.userId);
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

  /** Retrieves a ticket by ticketId */
  getTicket(ticketId: string): MatchTicket | undefined {
    return this.tickets.get(ticketId);
  }
}

/** Singleton queue instance */
export const matchmakingQueue = new MatchmakingQueue();
