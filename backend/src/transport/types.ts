import type { WebSocket } from "ws";

export type ConnectionId = string;   // opaque UUID — per WebSocket instance (transient)
export type ResumeToken  = string;   // opaque UUID — per logical connection (stable across reconnects)
export type UserId       = string;

export type ConnectionStatus =
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "DISCONNECTED";

export interface Connection {
  readonly id: ConnectionId;          // current WebSocket instance ID (changes on reconnect)
  readonly resumeToken: ResumeToken;  // stable logical connection ID (same across reconnects)
  readonly userId: UserId;
  ws: WebSocket;                      // mutable: replaced on successful reconnect
  status: ConnectionStatus;
  lastPongAt: number;
  nextSeq: number;                    // monotonic counter owned by logical connection
}

/**
 * Every outbound message carries a sequence number scoped to the logical connection (resumeToken).
 * Sequence numbers are NOT reset on reconnect — they are monotonically increasing for the
 * lifetime of the logical connection, enabling gap-free replay.
 */
export interface OutboundMessage {
  readonly seq: number;
  readonly type: string;
  readonly payload: unknown;
}

/**
 * Client sends resumeToken + lastReceivedSeq during reconnection handshake.
 */
export interface InboundMessage {
  readonly type: string;
  readonly payload: unknown;
  readonly resumeToken?: ResumeToken;  // present on reconnect handshake
  readonly lastReceivedSeq?: number;   // present on reconnect handshake
}
