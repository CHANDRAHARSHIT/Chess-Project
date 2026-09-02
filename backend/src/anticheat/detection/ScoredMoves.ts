/**
 * Selects the plies that carry information about who chose the move.
 *
 * No signal is computed over a player's whole move list. Raw accuracy and raw
 * engine-match rate are inflated by positions where any competent player finds
 * the same move, and that inflation is what makes a naive detector flag
 * everybody. See ../MULTI_GAME_REVIEW_REQUIREMENTS.md §4.
 */

import type { PersistedPly } from "../analysisRepository.js";
import type { ScoredMovePolicy } from "../feedback/PolicyRegistry.js";

export type PlyExclusionReason = "opening" | "decided_position" | "forced";

/** Why a ply was dropped, or undefined when it counts. */
export function findExclusionReason(
  ply: PersistedPly,
  policy: ScoredMovePolicy
): PlyExclusionReason | undefined {
  if (ply.ply < policy.openingExcludedPlies) return "opening";

  // Either side being decisively ahead saturates the win percentage, so the
  // move scores near-perfect regardless of who played it.
  if (Math.abs(ply.evalBeforeCp) >= policy.decidedPositionCp) return "decided_position";

  if (ply.legalMoveCount < policy.minLegalMoves) return "forced";

  return undefined;
}

export function selectScoredPlies(
  plies: readonly PersistedPly[],
  policy: ScoredMovePolicy
): PersistedPly[] {
  return plies.filter((ply) => findExclusionReason(ply, policy) === undefined);
}

/** Exclusion counts by reason, for the arbiter-facing evidence. */
export function countExclusions(
  plies: readonly PersistedPly[],
  policy: ScoredMovePolicy
): Record<PlyExclusionReason, number> {
  const counts: Record<PlyExclusionReason, number> = {
    opening: 0,
    decided_position: 0,
    forced: 0,
  };

  for (const ply of plies) {
    const reason = findExclusionReason(ply, policy);
    if (reason) counts[reason]++;
  }
  return counts;
}
