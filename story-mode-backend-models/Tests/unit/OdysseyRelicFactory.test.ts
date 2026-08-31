import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyRelicFactory } from "../../models/OdysseyRelicFactory.js";
import { OdysseyUndoRelic } from "../../models/OdysseyUndoRelic.js";
import { OdysseyHintRelic } from "../../models/OdysseyHintRelic.js";
import { OdysseyEvalBarRelic } from "../../models/OdysseyEvalBarRelic.js";
import { OdysseyTimeRelic } from "../../models/OdysseyTimeRelic.js";
import { OdysseyRerollRelic } from "../../models/OdysseyRerollRelic.js";
import { ERelicType } from "../../enums/ERelicType.js";

describe("OdysseyRelicFactory", () => {
  test("test_create_returnsOdysseyUndoRelicForUndoType", () => {
    assert.ok(OdysseyRelicFactory.create(ERelicType.Undo) instanceof OdysseyUndoRelic);
  });

  test("test_create_returnsOdysseyHintRelicForHintType", () => {
    assert.ok(OdysseyRelicFactory.create(ERelicType.Hint) instanceof OdysseyHintRelic);
  });

  test("test_create_returnsOdysseyEvalBarRelicForEvalBarType", () => {
    assert.ok(OdysseyRelicFactory.create(ERelicType.EvalBar) instanceof OdysseyEvalBarRelic);
  });

  test("test_create_returnsOdysseyTimeRelicForTimeType", () => {
    assert.ok(OdysseyRelicFactory.create(ERelicType.Time) instanceof OdysseyTimeRelic);
  });

  test("test_create_returnsOdysseyRerollRelicForRerollType", () => {
    assert.ok(OdysseyRelicFactory.create(ERelicType.Reroll) instanceof OdysseyRerollRelic);
  });

  test("test_create_passesChargesToConstructedRelic", () => {
    const relic = OdysseyRelicFactory.create(ERelicType.Undo, 3);
    assert.strictEqual(relic.charges, 3);
  });

  test("test_create_defaultsChargesToZero", () => {
    const relic = OdysseyRelicFactory.create(ERelicType.Hint);
    assert.strictEqual(relic.charges, 0);
  });
});
