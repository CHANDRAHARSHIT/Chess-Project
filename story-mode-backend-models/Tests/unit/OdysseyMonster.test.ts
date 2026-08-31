import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyMonster } from "../../models/OdysseyMonster.js";
import { OdysseyBattleNode } from "../../models/OdysseyBattleNode.js";
import { ENodeType } from "../../enums/ENodeType.js";
import { EDifficulty } from "../../enums/EDifficulty.js";

function makeNode(id: number, type: ENodeType.Enemy | ENodeType.Elite | ENodeType.Boss, difficulty: EDifficulty): OdysseyBattleNode {
  return new OdysseyBattleNode(id, type, "Node", 0, 0, [], "test", difficulty);
}

describe("OdysseyMonster", () => {
  test("test_forNode_returnsDarkKingForBossType", () => {
    const node = makeNode(1, ENodeType.Boss, EDifficulty.Intermediate);
    assert.strictEqual(OdysseyMonster.forNode(node).name, "The Dark King");
  });

  test("test_forNode_returnsQueensGuardForAdvancedDifficulty", () => {
    const node = makeNode(1, ENodeType.Enemy, EDifficulty.Advanced);
    assert.strictEqual(OdysseyMonster.forNode(node).name, "Queen's Guard");
  });

  test("test_forNode_returnsRookColossusForIntermediateDifficulty", () => {
    const node = makeNode(1, ENodeType.Enemy, EDifficulty.Intermediate);
    assert.strictEqual(OdysseyMonster.forNode(node).name, "Rook Colossus");
  });

  test("test_forNode_returnsKnightProwlerForEasyDifficultyWithEvenId", () => {
    const node = makeNode(2, ENodeType.Enemy, EDifficulty.Easy);
    assert.strictEqual(OdysseyMonster.forNode(node).name, "Knight Prowler");
  });

  test("test_forNode_returnsBishopPhantomForEasyDifficultyWithOddId", () => {
    const node = makeNode(3, ENodeType.Enemy, EDifficulty.Easy);
    assert.strictEqual(OdysseyMonster.forNode(node).name, "Bishop Phantom");
  });

  test("test_forNode_returnsPawnSentinelForBeginnerDifficulty", () => {
    const node = makeNode(1, ENodeType.Enemy, EDifficulty.Beginner);
    assert.strictEqual(OdysseyMonster.forNode(node).name, "Pawn Sentinel");
  });

  test("test_describe_returnsFormattedNameTitleRating", () => {
    const monster = new OdysseyMonster("Test", "Title", "~999", "icon");
    assert.strictEqual(monster.describe(), "Test, Title (~999)");
  });
});
