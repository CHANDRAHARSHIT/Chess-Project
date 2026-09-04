import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyPuzzleEncounter } from "../models/OdysseyPuzzleEncounter.js";
import { OdysseyPuzzleNode } from "../models/OdysseyPuzzleNode.js";
import { EDifficulty } from "../enums/EDifficulty.js";
import { makeGame } from "./factories.js";

function makePuzzleNode(difficulty: EDifficulty): OdysseyPuzzleNode {
  return new OdysseyPuzzleNode(1, "Puzzle", 0, 0, [], "test", difficulty);
}

describe("OdysseyPuzzleEncounter", () => {
  test("test_open_usesRatingBand800To1200ForBeginnerDifficulty", async () => {
    let capturedMin: number | undefined;
    let capturedMax: number | undefined;
    await OdysseyPuzzleEncounter.open(makePuzzleNode(EDifficulty.Beginner), async (min, max) => {
      capturedMin = min;
      capturedMax = max;
      return [{}];
    });
    assert.strictEqual(capturedMin, 800);
    assert.strictEqual(capturedMax, 1200);
  });

  test("test_open_usesRatingBand2000To2400ForAdvancedDifficulty", async () => {
    let capturedMin: number | undefined;
    let capturedMax: number | undefined;
    await OdysseyPuzzleEncounter.open(makePuzzleNode(EDifficulty.Advanced), async (min, max) => {
      capturedMin = min;
      capturedMax = max;
      return [{}];
    });
    assert.strictEqual(capturedMin, 2000);
    assert.strictEqual(capturedMax, 2400);
  });

  test("test_open_takesUpToFivePuzzlesFromTheFetchedSet", async () => {
    const encounter = await OdysseyPuzzleEncounter.open(makePuzzleNode(EDifficulty.Beginner), async () =>
      Array.from({ length: 10 }, (_, i) => ({ id: i }))
    );
    assert.strictEqual(encounter.puzzles.length, 5);
    assert.strictEqual(encounter.usedFallback, false);
  });

  test("test_open_fallsBackToProvidedPuzzlesWhenFetchReturnsEmpty", async () => {
    const encounter = await OdysseyPuzzleEncounter.open(makePuzzleNode(EDifficulty.Beginner), async () => [], [{ id: "fallback" }]);
    assert.strictEqual(encounter.usedFallback, true);
    assert.strictEqual(encounter.puzzles.length, 1);
  });

  test("test_resolveReward_awardsDifficultyTimes20CoinsWhenAllPuzzlesSolved", async () => {
    const encounter = await OdysseyPuzzleEncounter.open(makePuzzleNode(EDifficulty.Intermediate), async () => [{ id: 1 }, { id: 2 }]);
    const game = makeGame({ coins: 0 });
    const reward = encounter.resolveReward(encounter.puzzles.length, game);
    assert.strictEqual(reward.coinsAwarded, EDifficulty.Intermediate * 20);
    assert.strictEqual(game.coins, EDifficulty.Intermediate * 20);
  });

  test("test_resolveReward_awardsNoCoinsWhenNotAllPuzzlesSolved", async () => {
    const encounter = await OdysseyPuzzleEncounter.open(makePuzzleNode(EDifficulty.Intermediate), async () => [{ id: 1 }, { id: 2 }]);
    const game = makeGame({ coins: 0 });
    const reward = encounter.resolveReward(1, game);
    assert.strictEqual(reward.coinsAwarded, 0);
    assert.strictEqual(game.coins, 0);
  });
});
