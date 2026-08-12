/**
 * Contracts — Public barrel export
 *
 * All multiplayer domain contracts are re-exported from this single entry point.
 *
 * IMPORT RULE: Always import from the barrel, never from internal paths.
 *   ✓  import type { MatchDescriptor } from "../contracts/index.js"
 *   ✗  import type { MatchDescriptor } from "../contracts/matchDescriptor.js"
 *
 * These types are frozen — see README.md for the rules.
 */

// ── Match Descriptor (Matchmaking / producer → Session) ──────────────────────
export type {
  ParticipantCardinality,
  ParticipantAssignment,
  TimeControl,
  MatchProvenance,
  MatchDescriptor,
} from "./matchDescriptor.js";

// ── Variant Contract (Session → Variant) ─────────────────────────────────────
export type {
  VariantCardinality,
  TerminalOutcome,
  MoveValidationResult,
  GameState,
  Move,
  VariantContract,
} from "./variantContract.js";

// ── Game Result (Session → Results & Rating) ──────────────────────────────────
export type {
  TerminationReason,
  ResultOutcome,
  ResultParticipant,
  GameResult,
} from "./result.js";
