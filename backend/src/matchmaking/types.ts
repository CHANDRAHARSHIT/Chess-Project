import type { MatchDescriptor } from "../contracts/index.js";

/**
 * Status of a matchmaking queue ticket.
 */
export type TicketStatus = "WAITING" | "MATCHED" | "CANCELLED" | "EXPIRED";

/**
 * An in-memory FCFS queue ticket.
 */
export interface MatchTicket {
  readonly ticketId: string;        // crypto.randomUUID()
  readonly userId: string;
  readonly variantId: string;
  readonly enqueuedAt: number;      // Date.now()
  readonly expiresAt: number;       // enqueuedAt + TICKET_TTL_MS
  matchedAt: number | null;
  status: TicketStatus;
  descriptor?: MatchDescriptor;     // Present when status = "MATCHED"
  readonly name?: string;           // Display name at enqueue time, carried into the MatchDescriptor on pairing
  readonly image?: string;          // Avatar URL at enqueue time, carried into the MatchDescriptor on pairing
}
