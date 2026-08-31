import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyBossNode } from "../../models/OdysseyBossNode.js";
import { ENodeType } from "../../enums/ENodeType.js";

describe("OdysseyBossNode", () => {
  test("test_constructor_setsTypeToBoss", () => {
    const boss = new OdysseyBossNode(99, "Boss", 50, 100, [], "final");
    assert.strictEqual(boss.type, ENodeType.Boss);
  });

  test("test_constructor_resolvesMonsterAsDarkKing", () => {
    const boss = new OdysseyBossNode(99, "Boss", 50, 100, [], "final");
    assert.strictEqual(boss.monster.name, "The Dark King");
  });
});
