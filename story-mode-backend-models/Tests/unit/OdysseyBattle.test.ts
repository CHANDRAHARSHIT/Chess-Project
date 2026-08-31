import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyBattle } from "../../models/OdysseyBattle.js";
import { OdysseyBossNode } from "../../models/OdysseyBossNode.js";
import { BOT_CONDITION_THRESHOLD } from "../../models/OdysseyBotConditions.js";
import { EBotCondition } from "../../enums/EBotCondition.js";
import { EBattleEndReason } from "../../enums/EBattleEndReason.js";
import { EBattleResult } from "../../enums/EBattleResult.js";
import { EDifficulty } from "../../enums/EDifficulty.js";
import { makeBattleNode, makeGame } from "../support/factories.js";

describe("OdysseyBattle", () => {
  test("test_constructor_setsPlayerClockByDifficulty", () => {
    const battle = new OdysseyBattle(makeBattleNode(EDifficulty.Master));
    assert.strictEqual(battle.playerInitialSeconds, 180);
    assert.strictEqual(battle.playerSeconds, 180);
  });

  test("test_constructor_setsEnemyClockByDifficulty", () => {
    const battle = new OdysseyBattle(makeBattleNode(EDifficulty.Advanced));
    assert.strictEqual(battle.enemyInitialSeconds, 90);
  });

  test("test_constructor_defaultsEnemyClockTo60ForLowerDifficulties", () => {
    const battle = new OdysseyBattle(makeBattleNode(EDifficulty.Intermediate));
    assert.strictEqual(battle.enemyInitialSeconds, 60);
  });

  test("test_registerPlayerMove_increasesConfusedOnCheck", () => {
    const battle = new OdysseyBattle(makeBattleNode());
    battle.registerPlayerMove({ isCheck: true, isCapture: false });
    assert.strictEqual(battle.botConditions.get(EBotCondition.Confused), 15);
  });

  test("test_registerPlayerMove_increasesDistractedOnCapture", () => {
    const battle = new OdysseyBattle(makeBattleNode());
    battle.registerPlayerMove({ isCheck: false, isCapture: true });
    assert.strictEqual(battle.botConditions.get(EBotCondition.Distracted), 20);
  });

  test("test_registerPlayerMove_increasesRelaxedOnPassiveMove", () => {
    const battle = new OdysseyBattle(makeBattleNode());
    battle.registerPlayerMove({ isCheck: false, isCapture: false });
    assert.strictEqual(battle.botConditions.get(EBotCondition.Relaxed), 10);
  });

  test("test_registerPlayerMove_doesNotIncreaseRelaxedWhenMoveIsCheckAndCapture", () => {
    const battle = new OdysseyBattle(makeBattleNode());
    battle.registerPlayerMove({ isCheck: true, isCapture: true });
    assert.strictEqual(battle.botConditions.get(EBotCondition.Relaxed), 0);
  });

  test("test_computeAiMove_usesEngineMoveWhenNoConditionsActive", async () => {
    const battle = new OdysseyBattle(makeBattleNode(EDifficulty.Intermediate));
    const result = await battle.computeAiMove(
      "fen",
      () => ["a1a2"],
      async (fen, difficulty) => {
        assert.strictEqual(difficulty, EDifficulty.Intermediate);
        return "engine-move";
      }
    );
    assert.strictEqual(result.move, "engine-move");
  });

  test("test_computeAiMove_usesBeginnerDifficultyWhenRelaxedIsActive", async () => {
    const battle = new OdysseyBattle(makeBattleNode(EDifficulty.Master));
    battle.botConditions.increase(EBotCondition.Relaxed, BOT_CONDITION_THRESHOLD);
    let usedDifficulty: EDifficulty | undefined;
    await battle.computeAiMove(
      "fen",
      () => [],
      async (fen, difficulty) => {
        usedDifficulty = difficulty;
        return "m";
      }
    );
    assert.strictEqual(usedDifficulty, EDifficulty.Beginner);
  });

  test("test_computeAiMove_consumesConditionsRegardlessOfWhetherTheyTriggered", async () => {
    const battle = new OdysseyBattle(makeBattleNode());
    battle.botConditions.increase(EBotCondition.Relaxed, BOT_CONDITION_THRESHOLD);
    await battle.computeAiMove("fen", () => [], async () => "m");
    assert.strictEqual(battle.botConditions.get(EBotCondition.Relaxed), 0);
  });

  test("test_computeAiMove_decreasesEnemySecondsBy15WhenDistractedIsActive", async () => {
    const battle = new OdysseyBattle(makeBattleNode());
    const before = battle.enemySeconds;
    battle.botConditions.increase(EBotCondition.Distracted, BOT_CONDITION_THRESHOLD);
    await battle.computeAiMove("fen", () => [], async () => "m");
    assert.strictEqual(battle.enemySeconds, before - 15);
  });

  test("test_computeAiMove_neverDropsEnemySecondsBelow1WhenDistracted", async () => {
    const battle = new OdysseyBattle(makeBattleNode());
    battle.enemySeconds = 5;
    battle.botConditions.increase(EBotCondition.Distracted, BOT_CONDITION_THRESHOLD);
    await battle.computeAiMove("fen", () => [], async () => "m");
    assert.strictEqual(battle.enemySeconds, 1);
  });

  test("test_computeAiMove_canReturnARandomLegalMoveWhenConfusedIsActive", async () => {
    const battle = new OdysseyBattle(makeBattleNode());
    battle.botConditions.increase(EBotCondition.Confused, BOT_CONDITION_THRESHOLD);
    const originalRandom = Math.random;
    Math.random = () => 0; // forces the confused-random branch (< 0.5) and picks index 0
    try {
      const result = await battle.computeAiMove("fen", () => ["random-move"], async () => "engine-move");
      assert.strictEqual(result.move, "random-move");
    } finally {
      Math.random = originalRandom;
    }
  });

  test("test_computeAiMove_fallsBackToEngineMoveWhenConfusedRollFails", async () => {
    const battle = new OdysseyBattle(makeBattleNode());
    battle.botConditions.increase(EBotCondition.Confused, BOT_CONDITION_THRESHOLD);
    const originalRandom = Math.random;
    Math.random = () => 0.99; // fails the 50% confused-random-move roll
    try {
      const result = await battle.computeAiMove("fen", () => ["random-move"], async () => "engine-move");
      assert.strictEqual(result.move, "engine-move");
    } finally {
      Math.random = originalRandom;
    }
  });

  test("test_resolveOutcome_returnsVictoryOnCheckmateWhenPlayerWon", () => {
    const battle = new OdysseyBattle(makeBattleNode(EDifficulty.Beginner));
    const outcome = battle.resolveOutcome(EBattleEndReason.Checkmate, true, makeGame());
    assert.strictEqual(outcome.result, EBattleResult.Victory);
  });

  test("test_resolveOutcome_returnsDefeatOnCheckmateWhenPlayerLost", () => {
    const battle = new OdysseyBattle(makeBattleNode());
    const outcome = battle.resolveOutcome(EBattleEndReason.Checkmate, false, makeGame());
    assert.strictEqual(outcome.result, EBattleResult.Defeat);
  });

  test("test_resolveOutcome_alwaysReturnsDefeatOnDrawEvenWhenPlayerWon", () => {
    const battle = new OdysseyBattle(makeBattleNode());
    const outcome = battle.resolveOutcome(EBattleEndReason.Draw, true, makeGame());
    assert.strictEqual(outcome.result, EBattleResult.Defeat);
  });

  test("test_resolveOutcome_awards50CoinsForMasterDifficultyVictory", () => {
    const battle = new OdysseyBattle(makeBattleNode(EDifficulty.Master));
    const game = makeGame({ coins: 0 });
    battle.resolveOutcome(EBattleEndReason.Checkmate, true, game);
    assert.strictEqual(game.coins, 50);
  });

  test("test_resolveOutcome_awards30CoinsForIntermediateDifficultyVictory", () => {
    const battle = new OdysseyBattle(makeBattleNode(EDifficulty.Intermediate));
    const game = makeGame({ coins: 0 });
    battle.resolveOutcome(EBattleEndReason.Checkmate, true, game);
    assert.strictEqual(game.coins, 30);
  });

  test("test_resolveOutcome_awards15CoinsForBeginnerDifficultyVictory", () => {
    const battle = new OdysseyBattle(makeBattleNode(EDifficulty.Beginner));
    const game = makeGame({ coins: 0 });
    battle.resolveOutcome(EBattleEndReason.Checkmate, true, game);
    assert.strictEqual(game.coins, 15);
  });

  test("test_resolveOutcome_awardsNoCoinsOnDefeat", () => {
    const battle = new OdysseyBattle(makeBattleNode(EDifficulty.Master));
    const game = makeGame({ coins: 0 });
    battle.resolveOutcome(EBattleEndReason.Timeout, false, game);
    assert.strictEqual(game.coins, 0);
  });

  test("test_resolveOutcome_setsJourneyCompleteOnBossVictory", () => {
    const boss = new OdysseyBossNode(99, "Boss", 50, 100, [], "final");
    const battle = new OdysseyBattle(boss);
    const game = makeGame({ journeyComplete: false });
    battle.resolveOutcome(EBattleEndReason.Checkmate, true, game);
    assert.strictEqual(game.journeyComplete, true);
  });

  test("test_resolveOutcome_doesNotSetJourneyCompleteOnNonBossVictory", () => {
    const battle = new OdysseyBattle(makeBattleNode());
    const game = makeGame({ journeyComplete: false });
    battle.resolveOutcome(EBattleEndReason.Checkmate, true, game);
    assert.strictEqual(game.journeyComplete, false);
  });
});
