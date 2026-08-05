/**
 * multiplayer.ts
 *
 * Client-side mirror of the frozen backend contracts (backend/src/contracts/*) and the
 * WebSocket message shapes Session/Transport actually emit. These are type mirrors only —
 * the backend is the sole source of truth; nothing here invents a field the wire doesn't send.
 */

export interface ParticipantAssignment {
  userId: string;
  side: number;
}

export interface TimeControl {
  initialSeconds: number;
  incrementSeconds: number;
  label: string;
}

export type MatchProvenance = "queue" | "tournament" | "invite" | "bot" | "internal";

export interface MatchDescriptor {
  matchId: string;
  participants: ParticipantAssignment[];
  cardinality: { sides: number; perSide: number };
  variantId: string;
  variantParams: { positionId?: number; [key: string]: unknown };
  timeControl: TimeControl;
  rated: boolean;
  provenance: MatchProvenance;
  createdAt: string;
  ratingPoolId?: string;
}

export type TicketStatus = "WAITING" | "MATCHED" | "CANCELLED" | "EXPIRED";

export interface MatchTicket {
  ticketId: string;
  userId: string;
  variantId: string;
  enqueuedAt: number;
  expiresAt: number;
  matchedAt: number | null;
  status: TicketStatus;
  descriptor?: MatchDescriptor;
}

export type SessionStatus = "CREATED" | "WAITING" | "READY" | "PLAYING" | "PAUSED" | "COMPLETED" | "ABANDONED";

export type TerminationReason =
  | "checkmate"
  | "stalemate"
  | "draw_agreement"
  | "draw_repetition"
  | "draw_fifty_move"
  | "draw_insufficient_material"
  | "resignation"
  | "timeout"
  | "forfeit"
  | "abort";

export type ResultOutcome = { kind: "win"; winningSide: number } | { kind: "draw" };

export interface ResultParticipant {
  userId: string;
  side: number;
}

/** The frozen GameResult contract — arrives verbatim as the `game_over` payload. */
export interface GameResult {
  gameSessionId: string;
  matchId: string;
  terminationReason: TerminationReason;
  outcome: ResultOutcome;
  participants: ResultParticipant[];
  variantId: string;
  rated: boolean;
  provenance: MatchProvenance;
  endedAt: string;
  moveCount: number;
  moveHistory?: Record<string, unknown>[];
  timeControl?: TimeControl;
  durationSeconds?: number;
  ratingPoolId?: string;
}

/** Session's opaque Chess960 GameState — { fen, positionId }. */
export interface Chess960State {
  fen: string;
  positionId: number;
}

export interface SessionClockSnapshot {
  remainingMs: number[];
  lastMoveAt: number | null;
}

export interface StateUpdatePayload {
  state: Chess960State;
  clock: SessionClockSnapshot;
  status: SessionStatus;
}

export interface PresenceUpdatePayload {
  userId: string;
  connected: boolean;
}

/** Every message Session/Transport ever sends is this shape (backend/src/transport/types.ts). */
export interface OutboundMessage {
  seq: number;
  type: "connected" | "state_update" | "game_over" | "move_rejected" | "presence_update" | "error";
  payload: unknown;
}

/** Every message a client sends is this shape (backend/src/transport/types.ts InboundMessage). */
export interface InboundMessage {
  type?: string;
  payload?: unknown;
  resumeToken?: string;
  lastReceivedSeq?: number;
}
