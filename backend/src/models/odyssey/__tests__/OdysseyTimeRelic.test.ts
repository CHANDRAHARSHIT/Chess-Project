import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyTimeRelic } from "../models/OdysseyTimeRelic.js";
import { ETimeDirection } from "../enums/ETimeDirection.js";
import { EBotCondition } from "../enums/EBotCondition.js";
import { EDifficulty } from "../enums/EDifficulty.js";
import { makeBattle, makeGame } from "./factories.js";

describe("OdysseyTimeRelic", () => {
  test("test_applyInBattle_increasesPlayerSecondsByTenPercentOfInitial_whenIncreasingPlayerClock", () => {
    const relic = new OdysseyTimeRelic(1);
    const battle = makeBattle(EDifficulty.Beginner); // playerInitialSeconds = 600
    const before = battle.playerSeconds;
    relic.applyInBattle(battle, makeGame(), ETimeDirection.IncreasePlayerClock);
    assert.strictEqual(battle.playerSeconds, before + Math.floor(battle.playerInitialSeconds * 0.1));
  });

  test("test_applyInBattle_increasesRelaxedBy10_whenIncreasingPlayerClock", () => {
    const relic = new OdysseyTimeRelic(1);
    const battle = makeBattle();
    relic.applyInBattle(battle, makeGame(), ETimeDirection.IncreasePlayerClock);
    assert.strictEqual(battle.botConditions.get(EBotCondition.Relaxed), 10);
  });

  test("test_applyInBattle_decreasesEnemySecondsByTenPercentOfInitial_whenDecreasingEnemyClock", () => {
    const relic = new OdysseyTimeRelic(1);
    const battle = makeBattle(EDifficulty.Beginner); // enemyInitialSeconds = 60
    const before = battle.enemySeconds;
    relic.applyInBattle(battle, makeGame(), ETimeDirection.DecreaseEnemyClock);
    assert.strictEqual(battle.enemySeconds, before - Math.floor(battle.enemyInitialSeconds * 0.1));
  });

  test("test_applyInBattle_increasesDistractedBy20_whenDecreasingEnemyClock", () => {
    const relic = new OdysseyTimeRelic(1);
    const battle = makeBattle();
    relic.applyInBattle(battle, makeGame(), ETimeDirection.DecreaseEnemyClock);
    assert.strictEqual(battle.botConditions.get(EBotCondition.Distracted), 20);
  });

  test("test_applyInBattle_neverDropsEnemySecondsBelow1", () => {
    const relic = new OdysseyTimeRelic(1);
    const battle = makeBattle();
    battle.enemySeconds = 1;
    relic.applyInBattle(battle, makeGame(), ETimeDirection.DecreaseEnemyClock);
    assert.strictEqual(battle.enemySeconds, 1);
  });

  test("test_applyInBattle_defaultsToIncreasePlayerClockWhenDirectionOmitted", () => {
    const relic = new OdysseyTimeRelic(1);
    const battle = makeBattle();
    const before = battle.playerSeconds;
    relic.applyInBattle(battle, makeGame());
    assert.ok(battle.playerSeconds > before);
  });

  test("test_applyInBattle_doesNothingWhenNoChargesRemain", () => {
    const relic = new OdysseyTimeRelic(0);
    const battle = makeBattle();
    const before = battle.playerSeconds;
    relic.applyInBattle(battle, makeGame(), ETimeDirection.IncreasePlayerClock);
    assert.strictEqual(battle.playerSeconds, before);
  });
});
