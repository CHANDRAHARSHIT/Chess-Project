/**
 * The per-game metrics the review scores. Pure functions over scored plies.
 *
 * Every one of these is computed over the filtered move set, never a whole
 * game — see ScoredMoves.ts for why the raw figures mislead.
 */

import type { PersistedPly } from "../analysisRepository.js";
import { accuracyFor } from "./BlunderAnalyzer.js";

/** Mean per-move accuracy, 0–100. */
export function calculateAccuracy(scoredPlies: readonly PersistedPly[]): number {
  if (scoredPlies.length === 0) return 0;

  const total = scoredPlies.reduce(
    (sum, ply) => sum + accuracyFor(ply.evalBeforeCp, ply.evalAfterCp),
    0
  );
  return total / scoredPlies.length;
}

/** Share of scored plies matching the engine's first choice, 0–1. */
export function calculateEngineMatchRate(scoredPlies: readonly PersistedPly[]): number {
  if (scoredPlies.length === 0) return 0;
  return scoredPlies.filter(playedEngineBest).length / scoredPlies.length;
}

/**
 * Longest run of consecutive scored plies matching the engine's first choice.
 *
 * Contiguity is measured in the player's own plies, which alternate by two. A
 * ply dropped by the scored-move filter breaks the run rather than being
 * skipped over — otherwise a streak could be assembled out of moves that were
 * never actually consecutive, which is the inflation this signal exists to
 * avoid.
 */
export function calculateLongestEngineStreak(scoredPlies: readonly PersistedPly[]): number {
  let longest = 0;
  let current = 0;
  let previousPly: number | undefined;

  for (const ply of [...scoredPlies].sort((a, b) => a.ply - b.ply)) {
    const isConsecutive = previousPly !== undefined && ply.ply - previousPly === 2;
    current = playedEngineBest(ply) ? (isConsecutive ? current + 1 : 1) : 0;
    longest = Math.max(longest, current);
    previousPly = ply.ply;
  }
  return longest;
}

/**
 * Spread of per-game accuracy across the window, as a standard deviation.
 *
 * The anomaly is an abnormally *low* value. Human strength fluctuates between
 * games; a player whose games cluster in a narrow band is behaving less like a
 * human than one with a single outstanding result.
 */
export function calculateAccuracySpread(gameAccuracies: readonly number[]): number {
  if (gameAccuracies.length < 2) return 0;

  const mean = gameAccuracies.reduce((sum, value) => sum + value, 0) / gameAccuracies.length;
  const variance =
    gameAccuracies.reduce((sum, value) => sum + (value - mean) ** 2, 0) / gameAccuracies.length;
  return Math.sqrt(variance);
}

/**
 * Compares from-square and to-square only: the engine and the stored record can
 * disagree on promotion notation without disagreeing on the move.
 */
function playedEngineBest(ply: PersistedPly): boolean {
  if (!ply.bestMove || !ply.uci) return false;
  return ply.bestMove.slice(0, 4) === ply.uci.slice(0, 4);
}
