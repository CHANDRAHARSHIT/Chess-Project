import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { StatisticalBaselines } from "../detection/StatisticalBaselines.js";

const baselines = new StatisticalBaselines();

function baselineFor(rating: number | null) {
  return baselines.getFor({
    rating,
    variantId: "chess960",
    initialSeconds: 300,
    incrementSeconds: 3,
  });
}

describe("StatisticalBaselines", () => {
  it("uses the midpoint of the supplied accuracy range", () => {
    // 1400 band is 72-78%.
    assert.equal(baselineFor(1500).expectedAccuracy, 75);
  });

  it("places a rating in the right band at the boundaries", () => {
    assert.equal(baselineFor(1400).band.min, 1400);
    assert.equal(baselineFor(1399).band.min, 1200);
  });

  it("handles ratings below and above the table", () => {
    assert.equal(baselineFor(100).band.min, 0);
    assert.equal(baselineFor(3000).band.min, 2400);
  });

  it("converts blunders per 100 moves into a per-move rate", () => {
    // 1400 band is 7-8 per 100 moves.
    assert.ok(Math.abs(baselineFor(1500).expectedBlunderRate - 0.075) < 1e-9);
  });

  it("expects higher accuracy at higher ratings", () => {
    assert.ok(baselineFor(2400).expectedAccuracy > baselineFor(800).expectedAccuracy);
  });

  it("does not derive the standard deviation from the range width", () => {
    // The 1400 range spans 6 points; treating that as +/-1 SD would give 3, and
    // would make an ordinary good game a three-sigma event.
    assert.ok(baselineFor(1500).accuracyStdDev > 3);
  });

  it("falls back to a population baseline when no rating is supplied", () => {
    const population = baselineFor(null);

    assert.ok(population.expectedAccuracy > baselineFor(800).expectedAccuracy);
    assert.ok(population.expectedAccuracy < baselineFor(2400).expectedAccuracy);
  });

  it("expects stronger players to agree with the engine more often", () => {
    assert.ok(
      baselineFor(2400).expectedEngineCorrelation > baselineFor(800).expectedEngineCorrelation
    );
  });

  it("reports zero sample size — none of this is measured", () => {
    assert.equal(baselineFor(1500).sampleSize, 0);
    assert.equal(
      baselines.hasSufficientSample({
        rating: 1500,
        variantId: "chess960",
        initialSeconds: 300,
        incrementSeconds: 3,
      }),
      false
    );
  });
});
