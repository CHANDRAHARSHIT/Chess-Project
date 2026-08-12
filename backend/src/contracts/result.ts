/**
 * Game Result Contract
 *
 * The one-way, immutable terminal value emitted by Session when a game ends.
 * Decouples the game lifecycle from rating computation and record-keeping.
 *
 * PRODUCER
 *   Session — emits exactly one GameResult per game when a terminal state is reached.
 *
 * CONSUMER
 *   Results & Rating — the sole consumer. Persists the record and computes ratings.
 *
 * IMMUTABILITY
 *   Once emitted, a GameResult is never modified. Results & Rating may read it,
 *   persist derived data, and compute ratings — but never modifies the value itself.
 *
 * DECOUPLING
 *   Session emits and forgets. If Results & Rating is slow, unavailable, or fails,
 *   the game is still over. Session never blocks on Results.
 *   Rating computation happens outside the game lifecycle. A rating failure
 *   never loses a game record.
 *
 * RATING INDEPENDENCE
 *   Ratings never affect active games. A rating change during a game has no
 *   effect on that game's outcome, clock, or lifecycle.
 *
 * PERSISTENCE INDEPENDENCE
 *   The GameResult carries all information Results needs. Results does not
 *   query Session for additional data after receiving the Result.
 */

import type { MatchProvenance, TimeControl } from "./matchDescriptor.js";

// ─────────────────────────────────────────────────────────────────────────────
// Supporting types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * How the game ended.
 *
 * "abort" — game ended before meaningful play; no rating impact by convention.
 * All other reasons may affect ratings when rated = true.
 */
export type TerminationReason =
  | "checkmate"
  | "stalemate"
  | "draw_agreement"
  | "draw_repetition"
  | "draw_fifty_move"
  | "draw_insufficient_material"
  | "resignation"
  | "timeout"          // Clock expired — Session authority
  | "forfeit"          // Grace period expired — participant abandoned
  | "abort";           // Ended before meaningful play

/** Who won, or whether it was a draw. */
export type ResultOutcome =
  | {
      readonly kind: "win";
      /** Zero-indexed side number of the winning side. */
      readonly winningSide: number;
    }
  | { readonly kind: "draw" };

/** A participant as recorded in the Result. */
export interface ResultParticipant {
  /** Authenticated user ID. */
  readonly userId: string;
  /** Zero-indexed side number this participant played as. */
  readonly side: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Primary contract
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The immutable Game Result.
 *
 * Required fields carry everything Results & Rating needs to persist a record
 * and compute rating changes.
 *
 * Optional fields carry supplementary data for move history, replay, audit,
 * and future tournament aggregation. Results must not error if they are absent.
 */
export interface GameResult {
  // ── Required ───────────────────────────────────────────────────────────────

  /** Unique identifier for the game session that produced this Result. */
  readonly gameSessionId: string;

  /** Unique identifier for the match (from the Match Descriptor). */
  readonly matchId: string;

  /** How the game ended. */
  readonly terminationReason: TerminationReason;

  /** Who won, or draw. Derived from Variant terminal detection or Session authority. */
  readonly outcome: ResultOutcome;

  /**
   * All participants and their side assignments.
   * Copied from the Match Descriptor at Result emission time.
   */
  readonly participants: readonly ResultParticipant[];

  /** Variant that was played. */
  readonly variantId: string;

  /** Whether this game contributes to rated rankings. */
  readonly rated: boolean;

  /** How this match was produced. For tournament aggregation and audit. */
  readonly provenance: MatchProvenance;

  /** ISO 8601 timestamp of when the game reached its terminal state. */
  readonly endedAt: string;

  /** Total number of half-moves (plies) played before the game ended. */
  readonly moveCount: number;

  // ── Optional ───────────────────────────────────────────────────────────────

  /**
   * Full move record for replay and game history.
   * Each entry is an opaque move value — only the originating Variant can interpret it.
   * Absent when the game is aborted with zero meaningful moves.
   */
  readonly moveHistory?: readonly Readonly<Record<string, unknown>>[];

  /** Time control used in this game. From the Match Descriptor. */
  readonly timeControl?: TimeControl;

  /** Wall-clock duration of the game from first move to terminal state, in seconds. */
  readonly durationSeconds?: number;

  /**
   * Rating pool this game belongs to.
   * Present only when rated = true and pools are configured.
   * Flows from MatchDescriptor.ratingPoolId.
   */
  readonly ratingPoolId?: string;

  /**
   * Tournament-specific context — present only when provenance = "tournament".
   * Flows from MatchDescriptor.tournamentContext unchanged.
   * Opaque to all domains except the tournament engine.
   */
  readonly tournamentContext?: Readonly<Record<string, unknown>>;

  /**
   * Producer metadata — flows from MatchDescriptor.metadata unchanged.
   * For audit purposes only. No domain acts on this value.
   */
  readonly metadata?: Readonly<Record<string, unknown>>;
}
