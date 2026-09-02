/**
 * Turns per-game deviations into one signal score for a window.
 *
 * The central rule lives here: a signal's window score comes from the **median**
 * deviation plus how many games flagged, never the maximum. The maximum across a
 * window is exactly the isolated-event statistic the spec rejects — one
 * exceptional game must not produce a detection. See
 * ../MULTI_GAME_REVIEW_REQUIREMENTS.md §6.
 */

import type { CheckId } from "../types.js";
import type { PatternPolicy, SignalThresholds } from "../feedback/PolicyRegistry.js";

/** One game's contribution to one signal. */
export interface GameSignalValue {
  readonly gameRecordId: string;
  /** The raw metric — accuracy, match rate, streak length. */
  readonly value: number;
  /** Standard deviations from the band mean. Undefined when unmeasured. */
  readonly z?: number;
  readonly scoredMoveCount: number;
  /** False when the game had too little data. Never treated as a zero score. */
  readonly isMeasured: boolean;
  readonly isFlagged: boolean;
}

export interface SignalWindowScore {
  readonly signalId: CheckId;
  /** 0–100, the spec's Detection Check Score. */
  readonly score: number;
  readonly medianZ?: number;
  readonly flaggedGameCount: number;
  readonly measuredGameCount: number;
  readonly games: readonly GameSignalValue[];
}

export function calculateZScore(value: number, mean: number, standardDeviation: number): number {
  // A zero or negative deviation means the baseline claims no spread, which
  // would make every observation infinitely anomalous.
  if (standardDeviation <= 0) return 0;
  return (value - mean) / standardDeviation;
}

/**
 * Maps a deviation onto 0–100: nothing below the flag, saturating at the ceiling.
 * Linear between the two is a placeholder shape, not a decision.
 */
export function calculateScoreFromZ(z: number, thresholds: SignalThresholds): number {
  if (z < thresholds.zFlag) return 0;
  if (z >= thresholds.zCeiling) return 100;

  const span = thresholds.zCeiling - thresholds.zFlag;
  if (span <= 0) return 100;
  return Math.round(1 + ((z - thresholds.zFlag) / span) * 99);
}

export function calculateMedian(values: readonly number[]): number | undefined {
  if (values.length === 0) return undefined;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function buildGameSignalValue(
  gameRecordId: string,
  value: number,
  scoredMoveCount: number,
  thresholds: SignalThresholds,
  baselineMean: number,
  baselineStdDev: number
): GameSignalValue {
  if (scoredMoveCount < thresholds.minScoredMoves) {
    return { gameRecordId, value, scoredMoveCount, isMeasured: false, isFlagged: false };
  }

  const z = calculateZScore(value, baselineMean, baselineStdDev);
  return {
    gameRecordId,
    value,
    z,
    scoredMoveCount,
    isMeasured: true,
    isFlagged: z >= thresholds.zFlag,
  };
}

/**
 * Combines a signal's per-game values into one score.
 *
 * The median resists a single outlier: one four-sigma game barely moves the
 * median of ten, while six moderate games move it decisively. The flagged-game
 * count then gates whether the score counts at all — a signal that fired in
 * fewer games than the pattern policy requires contributes nothing.
 */
export function buildSignalWindowScore(
  signalId: CheckId,
  games: readonly GameSignalValue[],
  thresholds: SignalThresholds,
  pattern: PatternPolicy
): SignalWindowScore {
  const measured = games.filter((game) => game.isMeasured);
  const flaggedGameCount = measured.filter((game) => game.isFlagged).length;
  const medianZ = calculateMedian(measured.map((game) => game.z!));

  const base: Omit<SignalWindowScore, "score"> = {
    signalId,
    medianZ,
    flaggedGameCount,
    measuredGameCount: measured.length,
    games,
  };

  if (medianZ === undefined || !isPattern(flaggedGameCount, measured.length, pattern)) {
    return { ...base, score: 0 };
  }

  return {
    ...base,
    score: Math.min(pattern.singleSignalCap, calculateScoreFromZ(medianZ, thresholds)),
  };
}

/** Both an absolute count and a share of the window, so a long window cannot dilute the rule. */
function isPattern(
  flaggedGameCount: number,
  measuredGameCount: number,
  pattern: PatternPolicy
): boolean {
  if (measuredGameCount === 0) return false;
  return (
    flaggedGameCount >= pattern.flaggedGameCount &&
    flaggedGameCount / measuredGameCount >= pattern.flaggedGameFraction
  );
}
