import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyBotConditions, BOT_CONDITION_THRESHOLD } from "../models/OdysseyBotConditions.js";
import { EBotCondition } from "../enums/EBotCondition.js";

describe("OdysseyBotConditions", () => {
  test("test_get_returnsZeroInitially", () => {
    const conditions = new OdysseyBotConditions();
    assert.strictEqual(conditions.get(EBotCondition.Confused), 0);
    assert.strictEqual(conditions.get(EBotCondition.Relaxed), 0);
    assert.strictEqual(conditions.get(EBotCondition.Distracted), 0);
  });

  test("test_increase_addsAmountToCondition", () => {
    const conditions = new OdysseyBotConditions();
    conditions.increase(EBotCondition.Confused, 15);
    assert.strictEqual(conditions.get(EBotCondition.Confused), 15);
  });

  test("test_increase_clampsAtUpperBoundOf100", () => {
    const conditions = new OdysseyBotConditions();
    conditions.increase(EBotCondition.Confused, 90);
    conditions.increase(EBotCondition.Confused, 90);
    assert.strictEqual(conditions.get(EBotCondition.Confused), 100);
  });

  test("test_increase_clampsAtLowerBoundOf0", () => {
    const conditions = new OdysseyBotConditions();
    conditions.increase(EBotCondition.Confused, -50);
    assert.strictEqual(conditions.get(EBotCondition.Confused), 0);
  });

  test("test_isActive_returnsFalseBelowThreshold", () => {
    const conditions = new OdysseyBotConditions();
    conditions.increase(EBotCondition.Confused, BOT_CONDITION_THRESHOLD - 1);
    assert.strictEqual(conditions.isActive(EBotCondition.Confused), false);
  });

  test("test_isActive_returnsTrueAtThreshold", () => {
    const conditions = new OdysseyBotConditions();
    conditions.increase(EBotCondition.Confused, BOT_CONDITION_THRESHOLD);
    assert.strictEqual(conditions.isActive(EBotCondition.Confused), true);
  });

  test("test_consume_resetsConditionToZero", () => {
    const conditions = new OdysseyBotConditions();
    conditions.increase(EBotCondition.Distracted, 100);
    conditions.consume(EBotCondition.Distracted);
    assert.strictEqual(conditions.get(EBotCondition.Distracted), 0);
  });

  test("test_consume_doesNotAffectOtherConditions", () => {
    const conditions = new OdysseyBotConditions();
    conditions.increase(EBotCondition.Confused, 50);
    conditions.increase(EBotCondition.Relaxed, 30);
    conditions.consume(EBotCondition.Confused);
    assert.strictEqual(conditions.get(EBotCondition.Relaxed), 30);
  });
});
