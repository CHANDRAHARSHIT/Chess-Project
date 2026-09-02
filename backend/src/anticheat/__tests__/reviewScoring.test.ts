import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { scoreReviewWindow } from "../detection/ReviewScoring.js";
import { PolicyRegistry } from "../feedback/PolicyRegistry.js";
import type { BaselineMetrics } from "../detection/StatisticalBaselines.js";
import type { ReviewGame, ReviewWindow } from "../detection/ReviewWindow.js";
import type { PersistedPly } from "../analysisRepository.js";
import type { Situation } from "../types.js";

const SITUATION: Situation = { proficiency: "unknown", eventType: "unrated_game" };
const policy = new PolicyRegistry();
const PATTERN = policy.getPatternPolicy(SITUATION);
const ACCURACY_THRESHOLDS = policy.getSignalThresholds("accuracy", SITUATION)!;

/**
 * Placeholder baseline. Values are chosen so a "normal" game sits at the mean
 * and the tests move a known number of standard deviations away from it.
 */
const BASELINES: BaselineMetrics = {
  band: { min: 1400, max: 1599 },
  expectedAccuracy: 60,
  accuracyStdDev: 10,
  expectedCentipawnLoss: 80,
  centipawnLossStdDev: 30,
  expectedBlunderRate: 0.05,
  expectedMistakeRate: 0.1,
  expectedEngineCorrelation: 0.35,
  engineCorrelationStdDev: 0.1,
  expectedEngineStreak: 3,
  engineStreakStdDev: 1,
  expectedAccuracySpread: 12,
  accuracySpreadStdDev: 4,
  expectedCriticalPositionAccuracy: 55,
  expectedOpeningAccuracy: 65,
  expectedEndgameAccuracy: 60,
  expectedMeanThinkTimeMs: 5000,
  thinkTimeStdDevMs: 3000,
  sampleSize: 0,
  computedAt: new Date("2026-01-01T00:00:00.000Z"),
  corpusId: "placeholder",
};

/**
 * Builds plies whose per-move accuracy lands near `targetAccuracy`.
 *
 * Accuracy is an exponential decay over win percentage given away, so a fixed
 * centipawn loss from a level position produces a stable per-move accuracy.
 */
function buildPlies(count: number, centipawnLoss: number, engineBestCount = 0): PersistedPly[] {
  return Array.from({ length: count }, (_, index) => ({
    ply: 20 + index * 2,
    side: 0,
    san: "Nf3",
    uci: index < engineBestCount ? "g1f3" : "b1c3",
    evalBeforeCp: 0,
    evalAfterCp: -centipawnLoss,
    bestMove: "g1f3",
    legalMoveCount: 30,
  }));
}

function buildGame(gameRecordId: string, plies: PersistedPly[]): ReviewGame {
  return {
    gameRecordId,
    side: 0,
    endedAt: new Date("2026-09-01T00:00:00.000Z"),
    engineName: "stockfish-18-lite-single",
    engineDepth: 12,
    plies,
    scoredPlies: plies,
    exclusions: { opening: 0, decided_position: 0, forced: 0 },
  };
}

function buildWindow(games: ReviewGame[], rating: number | null = 1500): ReviewWindow {
  return {
    userId: "user-1",
    situation: SITUATION,
    rating,
    games,
    excludedGames: [],
    isSufficient: games.length >= policy.getReviewWindowPolicy(SITUATION).minAnalysableGames,
    isEngineConsistent: true,
  };
}

/** Ten ordinary games: small losses, few engine matches. */
function buildOrdinaryGames(count = 10): ReviewGame[] {
  return Array.from({ length: count }, (_, index) =>
    buildGame(`ordinary-${index}`, buildPlies(30, 60, 4))
  );
}

/** A game that is near-perfect and follows the engine throughout. */
function buildSuspiciousGame(gameRecordId: string): ReviewGame {
  return buildGame(gameRecordId, buildPlies(30, 0, 30));
}

describe("scoreReviewWindow", () => {
  it("never concludes cheating — it reports a threshold crossing and evidence", () => {
    const outcome = scoreReviewWindow(buildWindow(buildOrdinaryGames()), BASELINES, policy);

    assert.equal(typeof outcome.detected, "boolean");
    assert.ok(outcome.results.every((result) => result.evidence.length > 0));
    assert.equal(outcome.suspect.userId, "user-1");
  });

  it("does not detect ordinary play", () => {
    const outcome = scoreReviewWindow(buildWindow(buildOrdinaryGames()), BASELINES, policy);

    assert.equal(outcome.detected, false);
  });

  it("one perfect game in ten produces no detection", () => {
    const games = buildOrdinaryGames(9);
    games.push(buildSuspiciousGame("exceptional"));

    const outcome = scoreReviewWindow(buildWindow(games), BASELINES, policy);

    assert.equal(outcome.detected, false);
  });

  it("the median resists a single outlier, so its score stays at zero", () => {
    const games = buildOrdinaryGames(9);
    games.push(buildSuspiciousGame("exceptional"));

    const outcome = scoreReviewWindow(buildWindow(games), BASELINES, policy);
    const accuracy = outcome.results.find((result) => result.checkId === "accuracy");

    assert.equal(accuracy?.score, 0);
  });

  it("scores a signal only once enough games flag to be a pattern", () => {
    const belowPattern = Array.from({ length: 10 }, (_, index) =>
      index < PATTERN.flaggedGameCount - 1
        ? buildSuspiciousGame(`suspicious-${index}`)
        : buildGame(`ordinary-${index}`, buildPlies(30, 60, 4))
    );

    const outcome = scoreReviewWindow(buildWindow(belowPattern), BASELINES, policy);

    assert.equal(outcome.results.find((r) => r.checkId === "accuracy")?.score, 0);
  });

  it("scores a sustained pattern across most of the window", () => {
    const games = Array.from({ length: 10 }, (_, index) =>
      buildSuspiciousGame(`suspicious-${index}`)
    );

    const outcome = scoreReviewWindow(buildWindow(games), BASELINES, policy);

    assert.ok(outcome.totalScore > 0, "a sustained pattern must produce a score");
    assert.ok(
      (outcome.results.find((r) => r.checkId === "accuracy")?.score ?? 0) > 0,
      "accuracy should flag when every game is near-perfect"
    );
  });

  it("caps any single signal below the detection threshold", () => {
    const games = Array.from({ length: 10 }, (_, index) =>
      buildSuspiciousGame(`suspicious-${index}`)
    );

    const outcome = scoreReviewWindow(buildWindow(games), BASELINES, policy);

    for (const result of outcome.results) {
      assert.ok(
        result.score <= PATTERN.singleSignalCap,
        `${result.checkId} exceeded the single-signal cap`
      );
    }
  });

  it("omits the accuracy signal when no rating was supplied", () => {
    const outcome = scoreReviewWindow(buildWindow(buildOrdinaryGames(), null), BASELINES, policy);

    assert.equal(
      outcome.results.some((result) => result.checkId === "accuracy"),
      false
    );
    assert.ok(
      outcome.results.some((result) =>
        result.evidence.some((line) => line.includes("No rating supplied"))
      )
    );
  });

  it("still scores the rating-free signals without a rating", () => {
    const outcome = scoreReviewWindow(buildWindow(buildOrdinaryGames(), null), BASELINES, policy);

    const scored = outcome.results.map((result) => result.checkId);
    assert.ok(scored.includes("engine_correlation"));
    assert.ok(scored.includes("consistency"));
  });

  it("never detects on an insufficient window", () => {
    const games = Array.from({ length: 2 }, (_, index) => buildSuspiciousGame(`suspicious-${index}`));

    const outcome = scoreReviewWindow(buildWindow(games), BASELINES, policy);

    assert.equal(outcome.detected, false);
  });

  it("caps certainty below any penalty threshold while baselines are placeholders", () => {
    const games = Array.from({ length: 10 }, (_, index) =>
      buildSuspiciousGame(`suspicious-${index}`)
    );

    const outcome = scoreReviewWindow(buildWindow(games), BASELINES, policy);
    const certaintyPolicy = policy.getCertaintyPolicy(SITUATION);

    assert.equal(certaintyPolicy.placeholderMode, true);
    assert.ok(outcome.certainty <= certaintyPolicy.uncalibratedCeiling);
  });

  it("records excluded games in the evidence", () => {
    const window = {
      ...buildWindow(buildOrdinaryGames()),
      excludedGames: [{ gameRecordId: "bot-game", reason: "no_scored_moves" as const }],
    };

    const outcome = scoreReviewWindow(window, BASELINES, policy);

    assert.ok(
      outcome.results.some((result) =>
        result.evidence.some((line) => line.includes("bot-game"))
      )
    );
  });

  it("reports a signal as unmeasured rather than zero when a game is too short", () => {
    const shortGames = Array.from({ length: 10 }, (_, index) =>
      buildGame(`short-${index}`, buildPlies(ACCURACY_THRESHOLDS.minScoredMoves - 1, 60))
    );

    const outcome = scoreReviewWindow(buildWindow(shortGames), BASELINES, policy);
    const accuracy = outcome.results.find((result) => result.checkId === "accuracy");

    assert.equal(accuracy?.confidence, 0);
    assert.equal(accuracy?.score, 0);
  });
});
