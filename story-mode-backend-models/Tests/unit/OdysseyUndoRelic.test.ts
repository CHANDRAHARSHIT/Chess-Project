import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyUndoRelic } from "../../models/OdysseyUndoRelic.js";
import { EBotCondition } from "../../enums/EBotCondition.js";
import { makeBattle, makeGame } from "../support/factories.js";

describe("OdysseyUndoRelic", () => {
  test("test_applyInBattle_increasesConfusedBy25WhenChargeAvailable", () => {
    const relic = new OdysseyUndoRelic(1);
    const battle = makeBattle();
    relic.applyInBattle(battle, makeGame());
    assert.strictEqual(battle.botConditions.get(EBotCondition.Confused), 25);
  });

  test("test_applyInBattle_consumesOneCharge", () => {
    const relic = new OdysseyUndoRelic(2);
    relic.applyInBattle(makeBattle(), makeGame());
    assert.strictEqual(relic.charges, 1);
  });

  test("test_applyInBattle_doesNothingWhenNoChargesRemain", () => {
    const relic = new OdysseyUndoRelic(0);
    const battle = makeBattle();
    relic.applyInBattle(battle, makeGame());
    assert.strictEqual(battle.botConditions.get(EBotCondition.Confused), 0);
  });
});
