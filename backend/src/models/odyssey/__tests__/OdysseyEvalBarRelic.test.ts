import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyEvalBarRelic } from "../models/OdysseyEvalBarRelic.js";
import { EBotCondition } from "../enums/EBotCondition.js";
import { makeBattle, makeGame } from "./factories.js";

describe("OdysseyEvalBarRelic", () => {
  test("test_applyInBattle_increasesEvalMovesRemainingBy5", () => {
    const relic = new OdysseyEvalBarRelic(1);
    const battle = makeBattle();
    relic.applyInBattle(battle, makeGame());
    assert.strictEqual(battle.evalMovesRemaining, 5);
  });

  test("test_applyInBattle_increasesRelaxedBy15", () => {
    const relic = new OdysseyEvalBarRelic(1);
    const battle = makeBattle();
    relic.applyInBattle(battle, makeGame());
    assert.strictEqual(battle.botConditions.get(EBotCondition.Relaxed), 15);
  });

  test("test_applyInBattle_consumesOneCharge", () => {
    const relic = new OdysseyEvalBarRelic(2);
    relic.applyInBattle(makeBattle(), makeGame());
    assert.strictEqual(relic.charges, 1);
  });

  test("test_applyInBattle_doesNothingWhenNoChargesRemain", () => {
    const relic = new OdysseyEvalBarRelic(0);
    const battle = makeBattle();
    relic.applyInBattle(battle, makeGame());
    assert.strictEqual(battle.evalMovesRemaining, 0);
  });
});
