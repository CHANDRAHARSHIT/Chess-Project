import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  computeEloDelta,
  kFactorFor,
  PROVISIONAL_K,
  ESTABLISHED_K,
  PROVISIONAL_GAMES_THRESHOLD,
  ELO_SCORE,
} from "../ratingService.js";

describe("ratingService — frozen Elo constants (m4_implementation_plan.md §2)", () => {
  test("equal ratings, win, K=40 -> +20 (half of K, expected score is 0.5)", () => {
    assert.equal(computeEloDelta(1200, 1200, ELO_SCORE.WIN, 40), 20);
  });

  test("equal ratings, loss, K=40 -> -20", () => {
    assert.equal(computeEloDelta(1200, 1200, ELO_SCORE.LOSS, 40), -20);
  });

  test("equal ratings, draw -> 0 (the universal symmetric draw score, no swing)", () => {
    assert.equal(computeEloDelta(1200, 1200, ELO_SCORE.DRAW, 40), 0);
  });

  test("a higher-rated player beating a lower-rated player gains fewer points than the reverse upset", () => {
    const higherWins = computeEloDelta(1400, 1200, ELO_SCORE.WIN, 20);
    const lowerWins = computeEloDelta(1200, 1400, ELO_SCORE.WIN, 20);

    assert.ok(higherWins > 0 && lowerWins > 0);
    assert.ok(higherWins < lowerWins);
  });

  test("kFactorFor: provisional (K=40) below the 30-games threshold, established (K=20) at/after it", () => {
    assert.equal(kFactorFor(0), PROVISIONAL_K);
    assert.equal(kFactorFor(29), PROVISIONAL_K);
    assert.equal(kFactorFor(30), ESTABLISHED_K);
    assert.equal(kFactorFor(31), ESTABLISHED_K);
  });

  test("provisional threshold is exactly 30 games — FIDE's own provisional-rating cutoff", () => {
    assert.equal(PROVISIONAL_GAMES_THRESHOLD, 30);
  });
});
