import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyPuzzleNode } from "../../models/OdysseyPuzzleNode.js";
import { ENodeType } from "../../enums/ENodeType.js";
import { EDifficulty } from "../../enums/EDifficulty.js";

describe("OdysseyPuzzleNode", () => {
  test("test_constructor_assignsDifficultyAndPuzzleType", () => {
    const node = new OdysseyPuzzleNode(1, "Puzzle", 0, 0, [], "test", EDifficulty.Intermediate);
    assert.strictEqual(node.difficulty, EDifficulty.Intermediate);
    assert.strictEqual(node.type, ENodeType.Puzzle);
  });
});
