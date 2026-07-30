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
 */
export type SessionStatus =
  | "CREATED"
  | "WAITING"
  | "READY"
  | "PLAYING"
  | "COMPLETED"
  | "ABANDONED";

/**
 * Clock state for a session.
 * Side-indexed, rules-blind.
 * Clocks do not run during WAITING or READY.
 */
export interface SessionClock {
  readonly remainingMs: readonly number[]; // index = side number
  readonly lastMoveAt: number | null;      // wall-clock ms; null = not yet PLAYING
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
