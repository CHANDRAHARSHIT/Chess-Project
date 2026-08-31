import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyBattleNode } from "../../models/OdysseyBattleNode.js";
import { OdysseyMonster } from "../../models/OdysseyMonster.js";
import { ENodeType } from "../../enums/ENodeType.js";
import { EDifficulty } from "../../enums/EDifficulty.js";

describe("OdysseyBattleNode", () => {
  test("test_constructor_assignsDifficulty", () => {
    const node = new OdysseyBattleNode(1, ENodeType.Enemy, "Node", 0, 0, [], "test", EDifficulty.Advanced);
    assert.strictEqual(node.difficulty, EDifficulty.Advanced);
  });

  test("test_constructor_resolvesMonsterViaOdysseyMonsterForNode", () => {
    const node = new OdysseyBattleNode(1, ENodeType.Enemy, "Node", 0, 0, [], "test", EDifficulty.Advanced);
    assert.ok(node.monster instanceof OdysseyMonster);
    assert.strictEqual(node.monster.name, "Queen's Guard");
  });
});
