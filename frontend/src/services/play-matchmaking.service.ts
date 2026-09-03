/**
 * matchmaking.service.ts
 * Thin HTTP client for POST/DELETE/GET /api/matchmaking/queue — mirrors the static-class
 * pattern used by PaymentService/OpeningService. No polling or queue-state logic lives here;
 * that belongs to MatchmakingContext. This module only knows how to talk to the endpoint.
 */
import type { MatchTicket, MatchDescriptor, TicketStatus } from "@/types/play-multiplayer.types";

export interface EnqueueResponse {
  ticket: MatchTicket;
  matched: boolean;
  matchDescriptor?: MatchDescriptor;
}

export interface TicketStatusResponse {
  ticket: MatchTicket;
  status: TicketStatus;
  matchDescriptor?: MatchDescriptor;
}

/** Thrown when the backend responds 503 — multiplayer is flag-disabled, a first-class state. */
export class MultiplayerDisabledError extends Error {
  constructor() {
    super("Multiplayer features are currently disabled.");
    this.name = "MultiplayerDisabledError";
  }
}

/** Thrown when a polled ticket is gone (expired or already cleaned up). */
export class TicketNotFoundError extends Error {
  constructor() {
    super("Ticket not found or expired.");
    this.name = "TicketNotFoundError";
  }
}

export class MatchmakingService {
  static async enqueue(variantId: string): Promise<EnqueueResponse> {
    const res = await fetch("/api/matchmaking/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId }),
    });
    if (res.status === 503) throw new MultiplayerDisabledError();
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to join the queue.");
    }
    return res.json();
  }

  static async cancel(ticketId: string): Promise<void> {
    const res = await fetch(`/api/matchmaking/queue/${ticketId}`, { method: "DELETE" });
    if (res.status === 503) throw new MultiplayerDisabledError();
    if (!res.ok && res.status !== 404) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to cancel the search.");
    }
  }

  static async getStatus(ticketId: string): Promise<TicketStatusResponse> {
    const res = await fetch(`/api/matchmaking/queue/${ticketId}`);
    if (res.status === 503) throw new MultiplayerDisabledError();
    if (res.status === 404) throw new TicketNotFoundError();
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to check queue status.");
    }
    return res.json();
  }
}
