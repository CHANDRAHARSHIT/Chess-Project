import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyRelicFactory } from "../models/OdysseyRelicFactory.js";
import { MAX_RELIC_CHARGES } from "../models/OdysseyRelic.js";
import { ERelicType } from "../enums/ERelicType.js";

describe("OdysseyRelic", () => {
  test("test_constructor_throwsWhenChargesIsNegative", () => {
    assert.throws(() => OdysseyRelicFactory.create(ERelicType.Undo, -1), RangeError);
  });

  test("test_constructor_throwsWhenChargesExceedsMax", () => {
    assert.throws(() => OdysseyRelicFactory.create(ERelicType.Undo, MAX_RELIC_CHARGES + 1), RangeError);
  });

  test("test_constructor_acceptsChargesWithinRange", () => {
    const relic = OdysseyRelicFactory.create(ERelicType.Undo, MAX_RELIC_CHARGES);
    assert.strictEqual(relic.charges, MAX_RELIC_CHARGES);
  });

  test("test_hasCharge_returnsTrueWhenChargesGreaterThanZero", () => {
    const relic = OdysseyRelicFactory.create(ERelicType.Hint, 1);
    assert.strictEqual(relic.hasCharge(), true);
  });

  test("test_hasCharge_returnsFalseWhenChargesIsZero", () => {
    const relic = OdysseyRelicFactory.create(ERelicType.Hint, 0);
    assert.strictEqual(relic.hasCharge(), false);
  });

  test("test_consume_decrementsChargesAndReturnsTrueWhenAvailable", () => {
    const relic = OdysseyRelicFactory.create(ERelicType.EvalBar, 2);
    const result = relic.consume();
    assert.strictEqual(result, true);
    assert.strictEqual(relic.charges, 1);
  });

  test("test_consume_returnsFalseAndLeavesChargesUnchangedWhenNoneRemain", () => {
    const relic = OdysseyRelicFactory.create(ERelicType.EvalBar, 0);
    const result = relic.consume();
    assert.strictEqual(result, false);
    assert.strictEqual(relic.charges, 0);
  });
});
