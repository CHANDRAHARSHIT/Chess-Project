import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  calculateAccuracySpread,
  calculateEngineMatchRate,
  calculateLongestEngineStreak,
} from "../detection/Signals.js";
import {
  calculateMedian,
  calculateScoreFromZ,
  calculateZScore,
} from "../detection/SignalScoring.js";
import type { PersistedPly } from "../analysisRepository.js";
import type { SignalThresholds } from "../feedback/PolicyRegistry.js";

const THRESHOLDS: SignalThresholds = {
  zFlag: 2,
  zCeiling: 4,
  minScoredMoves: 0,
  enabled: true,
  weight: 1,
};

function buildPly(ply: number, playedBest: boolean): PersistedPly {
  return {
    ply,
    side: 0,
    san: "Nf3",
    uci: playedBest ? "g1f3" : "b1c3",
    evalBeforeCp: 0,
    evalAfterCp: 0,
    bestMove: "g1f3",
    legalMoveCount: 30,
  };
}

describe("score curve", () => {
  it("scores nothing below the flag threshold", () => {
    assert.equal(calculateScoreFromZ(THRESHOLDS.zFlag - 0.01, THRESHOLDS), 0);
  });

  it("saturates at the ceiling", () => {
    assert.equal(calculateScoreFromZ(THRESHOLDS.zCeiling, THRESHOLDS), 100);
    assert.equal(calculateScoreFromZ(99, THRESHOLDS), 100);
  });

  it("rises monotonically between the two", () => {
    const low = calculateScoreFromZ(2.5, THRESHOLDS);
    const high = calculateScoreFromZ(3.5, THRESHOLDS);

    assert.ok(low > 0 && low < high && high < 100);
  });

  it("treats a zero standard deviation as no deviation, not infinite anomaly", () => {
    assert.equal(calculateZScore(90, 60, 0), 0);
  });
});

describe("calculateMedian", () => {
  it("is undefined for no values", () => {
    assert.equal(calculateMedian([]), undefined);
  });

  it("averages the middle pair for an even count", () => {
    assert.equal(calculateMedian([1, 2, 3, 4]), 2.5);
  });

  it("ignores an extreme outlier, which is why the window uses it", () => {
    assert.equal(calculateMedian([1, 1, 1, 1, 100]), 1);
  });
});

describe("engine correlation", () => {
  it("measures the share of scored plies matching the engine", () => {
    const rate = calculateEngineMatchRate([
      buildPly(20, true),
      buildPly(22, true),
      buildPly(24, false),
      buildPly(26, false),
    ]);

    assert.equal(rate, 0.5);
  });

  it("counts a run of consecutive engine-best moves", () => {
    const streak = calculateLongestEngineStreak([
      buildPly(20, true),
      buildPly(22, true),
      buildPly(24, true),
      buildPly(26, false),
    ]);

    assert.equal(streak, 3);
  });

  it("breaks a streak across a gap, so filtered-out plies cannot manufacture one", () => {
    const streak = calculateLongestEngineStreak([
      buildPly(20, true),
      buildPly(22, true),
      // ply 24 was excluded by the scored-move filter
      buildPly(26, true),
      buildPly(28, true),
    ]);

    assert.equal(streak, 2);
  });
});

describe("calculateAccuracySpread", () => {
  it("is zero for identical games — the machine-like case", () => {
    assert.equal(calculateAccuracySpread([80, 80, 80, 80]), 0);
  });

  it("grows as games vary", () => {
    assert.ok(calculateAccuracySpread([60, 90, 70, 85]) > 0);
  });

  it("needs at least two games to mean anything", () => {
    assert.equal(calculateAccuracySpread([80]), 0);
  });
});
