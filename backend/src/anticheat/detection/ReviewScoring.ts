/**
 * Scores an assembled ReviewWindow into a DetectionOutcome.
 *
 * `detected` means a threshold was crossed. It does not mean the user cheated —
 * only a resolved ReviewCase with a human arbiter concludes that. Nothing here
 * penalises, notifies, or persists.
 */

import type {
  CheckResult,
  DetectionOutcome,
  Situation,
  Suspect,
} from "../types.js";
import type { PolicyRegistry } from "../feedback/PolicyRegistry.js";
import type { BaselineMetrics } from "./StatisticalBaselines.js";
import type { ReviewGame, ReviewWindow } from "./ReviewWindow.js";
import {
  calculateAccuracy,
  calculateAccuracySpread,
  calculateEngineMatchRate,
  calculateLongestEngineStreak,
} from "./Signals.js";
import {
  buildGameSignalValue,
  buildSignalWindowScore,
  calculateScoreFromZ,
  calculateZScore,
  type GameSignalValue,
  type SignalWindowScore,
} from "./SignalScoring.js";

const ACCURACY_SIGNAL = "accuracy";
const ENGINE_CORRELATION_SIGNAL = "engine_correlation";
const ENGINE_STREAK_SIGNAL = "engine_streak";
const CONSISTENCY_SIGNAL = "consistency";

export function scoreReviewWindow(
  window: ReviewWindow,
  baselines: BaselineMetrics,
  policy: PolicyRegistry
): DetectionOutcome {
  const situation = window.situation;
  const pattern = policy.getPatternPolicy(situation);
  const threshold = policy.getDetectionThreshold(situation);

  const signalScores = [
    scoreAccuracy(window, baselines, policy),
    scoreEngineCorrelation(window, baselines, policy),
    scoreEngineStreak(window, baselines, policy),
    scoreConsistency(window, baselines, policy),
  ].filter((score): score is SignalWindowScore => score !== undefined);

  const weightedTotal = calculateWeightedTotal(signalScores, situation, policy);
  const coOccurrenceGames = countCoOccurrenceGames(signalScores);
  const flaggedGameRecordIds = collectFlaggedGameRecordIds(signalScores);
  const totalScore =
    coOccurrenceGames >= pattern.coOccurrenceGameCount
      ? Math.round(weightedTotal * pattern.coOccurrenceMultiplier)
      : weightedTotal;

  return {
    windowId: buildWindowId(window),
    suspect: buildSuspect(window),
    situation,
    results: signalScores.map((score) => buildCheckResult(score, window, coOccurrenceGames)),
    totalScore,
    threshold,
    detected: isDetected(
      window,
      flaggedGameRecordIds.length,
      totalScore,
      threshold,
      pattern.flaggedGameCount
    ),
    flaggedGameRecordIds,
    certainty: calculateCertainty(totalScore, threshold, situation, policy),
    evaluatedAt: new Date(),
  };
}

// ── Signals ──────────────────────────────────────────────────────────────────

/**
 * Undefined when no rating was supplied. Accuracy is only meaningful against
 * the expectation for a rating band — 90% is unremarkable at 2400 and extreme
 * at 1500 — so without one the signal is absent, never defaulted.
 */
function scoreAccuracy(
  window: ReviewWindow,
  baselines: BaselineMetrics,
  policy: PolicyRegistry
): SignalWindowScore | undefined {
  const thresholds = policy.getSignalThresholds(ACCURACY_SIGNAL, window.situation);
  if (!thresholds?.enabled || window.rating === null) return undefined;

  const games = window.games.map((game) =>
    buildGameSignalValue(
      game.gameRecordId,
      calculateAccuracy(game.scoredPlies),
      game.scoredPlies.length,
      thresholds,
      baselines.expectedAccuracy,
      baselines.accuracyStdDev
    )
  );

  return buildSignalWindowScore(
    ACCURACY_SIGNAL,
    games,
    thresholds,
    policy.getPatternPolicy(window.situation)
  );
}

function scoreEngineCorrelation(
  window: ReviewWindow,
  baselines: BaselineMetrics,
  policy: PolicyRegistry
): SignalWindowScore | undefined {
  return scorePerGameSignal(
    ENGINE_CORRELATION_SIGNAL,
    window,
    policy,
    (game) => calculateEngineMatchRate(game.scoredPlies),
    baselines.expectedEngineCorrelation,
    baselines.engineCorrelationStdDev
  );
}

function scoreEngineStreak(
  window: ReviewWindow,
  baselines: BaselineMetrics,
  policy: PolicyRegistry
): SignalWindowScore | undefined {
  return scorePerGameSignal(
    ENGINE_STREAK_SIGNAL,
    window,
    policy,
    (game) => calculateLongestEngineStreak(game.scoredPlies),
    baselines.expectedEngineStreak,
    baselines.engineStreakStdDev
  );
}

function scorePerGameSignal(
  signalId: string,
  window: ReviewWindow,
  policy: PolicyRegistry,
  measure: (game: ReviewGame) => number,
  baselineMean: number,
  baselineStdDev: number
): SignalWindowScore | undefined {
  const thresholds = policy.getSignalThresholds(signalId, window.situation);
  if (!thresholds?.enabled) return undefined;

  const games = window.games.map((game) =>
    buildGameSignalValue(
      game.gameRecordId,
      measure(game),
      game.scoredPlies.length,
      thresholds,
      baselineMean,
      baselineStdDev
    )
  );

  return buildSignalWindowScore(
    signalId,
    games,
    thresholds,
    policy.getPatternPolicy(window.situation)
  );
}

/**
 * Window-level, not per-game: consistency has no meaning inside one game.
 *
 * The deviation is inverted — a spread *below* the expected one is the anomaly,
 * so the z-score is computed as expected-minus-observed.
 */
function scoreConsistency(
  window: ReviewWindow,
  baselines: BaselineMetrics,
  policy: PolicyRegistry
): SignalWindowScore | undefined {
  const thresholds = policy.getSignalThresholds(CONSISTENCY_SIGNAL, window.situation);
  if (!thresholds?.enabled || window.games.length < 2) return undefined;

  const accuracies = window.games.map((game) => calculateAccuracy(game.scoredPlies));
  const spread = calculateAccuracySpread(accuracies);
  const z = calculateZScore(
    baselines.expectedAccuracySpread - spread,
    0,
    baselines.accuracySpreadStdDev
  );

  return {
    signalId: CONSISTENCY_SIGNAL,
    score:
      z >= thresholds.zFlag
        ? Math.min(
            policy.getPatternPolicy(window.situation).singleSignalCap,
            calculateScoreFromZ(z, thresholds)
          )
        : 0,
    medianZ: z,
    flaggedGameCount: z >= thresholds.zFlag ? window.games.length : 0,
    measuredGameCount: window.games.length,
    games: [],
  };
}

// ── Aggregation ──────────────────────────────────────────────────────────────

function calculateWeightedTotal(
  scores: readonly SignalWindowScore[],
  situation: Situation,
  policy: PolicyRegistry
): number {
  return Math.round(
    scores.reduce((total, score) => {
      const weight = policy.getSignalThresholds(score.signalId, situation)?.weight ?? 0;
      return total + score.score * weight;
    }, 0)
  );
}

/**
 * Games where two or more independent signals flagged together.
 *
 * The same two signals firing in one game is a coherent story; firing in
 * different games is two unrelated anomalies. Only the former earns the
 * multiplier.
 */
function countCoOccurrenceGames(scores: readonly SignalWindowScore[]): number {
  const flagsPerGame = new Map<string, number>();

  for (const score of scores) {
    for (const game of score.games) {
      if (!game.isFlagged) continue;
      flagsPerGame.set(game.gameRecordId, (flagsPerGame.get(game.gameRecordId) ?? 0) + 1);
    }
  }

  return [...flagsPerGame.values()].filter((count) => count >= 2).length;
}

/**
 * The hard pattern floor, kept as an explicit branch rather than left to emerge
 * from threshold arithmetic: too few flagged games means no detection whatever
 * the score. One exceptional game in ten can never produce one.
 */
function isDetected(
  window: ReviewWindow,
  flaggedGameCount: number,
  totalScore: number,
  threshold: number,
  requiredFlaggedGames: number
): boolean {
  if (!window.isSufficient) return false;
  if (flaggedGameCount < requiredFlaggedGames) return false;
  return totalScore > threshold;
}

/** Distinct games flagged by any signal. Ordered, so an outcome is reproducible. */
function collectFlaggedGameRecordIds(scores: readonly SignalWindowScore[]): string[] {
  const flagged = new Set<string>();
  for (const score of scores) {
    for (const game of score.games) {
      if (game.isFlagged) flagged.add(game.gameRecordId);
    }
  }
  return [...flagged].sort();
}

/**
 * Calibrated probability of a violation — except it is not calibrated yet.
 *
 * While baselines are placeholders the value is capped below the certainty any
 * penalty requires, so a review computed from guessed numbers cannot trigger a
 * consequence at any score. Real calibration needs the Simulation module.
 */
function calculateCertainty(
  totalScore: number,
  threshold: number,
  situation: Situation,
  policy: PolicyRegistry
): number {
  const certaintyPolicy = policy.getCertaintyPolicy(situation);
  const uncapped = threshold > 0 ? Math.min(1, totalScore / (threshold * 2)) : 0;

  return certaintyPolicy.placeholderMode
    ? Math.min(certaintyPolicy.uncalibratedCeiling, uncapped)
    : uncapped;
}

// ── Outcome assembly ─────────────────────────────────────────────────────────

function buildCheckResult(
  score: SignalWindowScore,
  window: ReviewWindow,
  coOccurrenceGames: number
): CheckResult {
  return {
    checkId: score.signalId,
    score: score.score,
    confidence:
      window.games.length > 0 ? score.measuredGameCount / window.games.length : 0,
    evidence: buildEvidence(score, window, coOccurrenceGames),
  };
}

/** For the arbiter. Never surfaced to the suspect — published thresholds become targets. */
function buildEvidence(
  score: SignalWindowScore,
  window: ReviewWindow,
  coOccurrenceGames: number
): string[] {
  const evidence = [
    `Measured in ${score.measuredGameCount} of ${window.games.length} games in the window.`,
    `Flagged in ${score.flaggedGameCount} of ${score.measuredGameCount} measured games.`,
  ];

  if (score.medianZ !== undefined) {
    evidence.push(`Median deviation ${score.medianZ.toFixed(2)} SD from the expected mean.`);
  }
  if (coOccurrenceGames > 0) {
    evidence.push(`${coOccurrenceGames} game(s) flagged on two or more signals together.`);
  }
  if (window.excludedGames.length > 0) {
    evidence.push(
      `${window.excludedGames.length} candidate game(s) excluded: ` +
        window.excludedGames.map((game) => `${game.gameRecordId} (${game.reason})`).join(", ")
    );
  }
  if (!window.isEngineConsistent) {
    evidence.push("Window mixes engine builds or depths; evaluations are not directly comparable.");
  }
  if (window.rating === null) {
    evidence.push("No rating supplied, so accuracy-versus-rating could not be evaluated.");
  }

  return evidence;
}

function buildSuspect(window: ReviewWindow): Suspect {
  return {
    userId: window.userId,
    ratingAtEvent: window.rating,
    proficiency: window.situation.proficiency,
    // No escalation state is persisted anywhere yet, so these are facts, not defaults.
    priorStrikeCount: 0,
    underHeightenedScrutiny: false,
  };
}

function buildWindowId(window: ReviewWindow): string {
  return `${window.userId}:${window.games.map((game) => game.gameRecordId).join(",")}`;
}
