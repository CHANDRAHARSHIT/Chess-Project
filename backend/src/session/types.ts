import type {
  MatchDescriptor,
  VariantContract,
  GameState,
  Move,
  GameResult,
} from "../contracts/index.js";

/**
 * Session status values.
 * CREATED → WAITING → READY → PLAYING → COMPLETED / ABANDONED
 *
 * PAUSED (M1-AM-01): added in M2. Phase 3.2 §4 (frozen) always specified this state for the
 * "all participants disconnected simultaneously" case; M1's SessionManager omitted it while
 * building the pillar in isolation. Only the PLAYING branch gains a PAUSED detour — every other
 * transition is unchanged.
 */
export type SessionStatus =
  | "CREATED"
  | "WAITING"
  | "READY"
  | "PLAYING"
  | "PAUSED"
  | "COMPLETED"
  | "ABANDONED";

/**
 * Clock state for a session.
 * Side-indexed, rules-blind.
 * Clocks do not run during CREATED, WAITING, PAUSED, or a terminal state.
 * M6: the side to move first is charged from READY (game start) onward, not just from
 * PLAYING (their first move) — see SessionManager.notifyAllPresent()'s M6 comment.
 */
export interface SessionClock {
  readonly remainingMs: readonly number[]; // index = side number
  readonly lastMoveAt: number | null;      // wall-clock ms; null = not yet READY, or still inside the match-start grace
}

/**
 * Represents a single multiplayer game session.
 * Single state owner of session lifecycle, clock, and move history.
 */
export interface GameSession {
  readonly sessionId: string;
  readonly matchDescriptor: MatchDescriptor; // immutable after creation
  status: SessionStatus;
  readonly variant: VariantContract;
  clock: SessionClock;
  moveHistory: readonly Move[];               // Session is sole owner of move history
  currentState: GameState;                    // opaque to Session; forwarded to Variant
  resultEmitted: boolean;                     // invariant: GameResult emitted at most once
  readonly createdAt: number;                 // wall-clock creation timestamp
  startedAt: number | null;                   // wall-clock timestamp when entering PLAYING state
}

/**
 * Type of callback/listener for fire-and-forget GameResult emission.
 */
export type ResultEmitter = (result: GameResult) => void;

/**
 * Session's outbound view of Transport — injected, never imported concretely.
 * Mirrors the existing ResultEmitter/variantResolver constructor-injection pattern.
 */
export interface SessionTransport {
  send(userId: string, message: { type: string; payload: unknown }): void;
  broadcast(userIds: string[], message: { type: string; payload: unknown }): void;
  isConnected(userId: string): boolean;
}

/** Default no-op transport so SessionManager remains usable (e.g. in unit tests) without one. */
export const noOpSessionTransport: SessionTransport = {
  send: () => {},
  broadcast: () => {},
  isConnected: () => false,
};
