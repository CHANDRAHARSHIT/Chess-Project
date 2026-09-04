import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyHintRelic } from "../../models/OdysseyHintRelic.js";
import { EBotCondition } from "../../enums/EBotCondition.js";
import { makeBattle, makeGame } from "../support/factories.js";

describe("OdysseyHintRelic", () => {
  test("test_applyInBattle_increasesDistractedBy15WhenChargeAvailable", () => {
    const relic = new OdysseyHintRelic(1);
    const battle = makeBattle();
    relic.applyInBattle(battle, makeGame());
    assert.strictEqual(battle.botConditions.get(EBotCondition.Distracted), 15);
  });

  test("test_applyInBattle_consumesOneCharge", () => {
    const relic = new OdysseyHintRelic(2);
    relic.applyInBattle(makeBattle(), makeGame());
    assert.strictEqual(relic.charges, 1);
  });

  test("test_applyInBattle_doesNothingWhenNoChargesRemain", () => {
    const relic = new OdysseyHintRelic(0);
    const battle = makeBattle();
    relic.applyInBattle(battle, makeGame());
    assert.strictEqual(battle.botConditions.get(EBotCondition.Distracted), 0);
  });
});
