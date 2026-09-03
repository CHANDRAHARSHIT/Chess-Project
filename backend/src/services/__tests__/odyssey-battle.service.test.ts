import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { OdysseyBattleService } from "../odyssey-battle.service.js";
import { OdysseyGameRepository } from "../../repositories/OdysseyGameRepository.js";
import { OdysseyRelicFactory } from "../../models/odyssey/models/OdysseyRelicFactory.js";
import { ERelicType } from "../../models/odyssey/enums/ERelicType.js";
import { ENodeType } from "../../models/odyssey/enums/ENodeType.js";
import { EBattleEndReason } from "../../models/odyssey/enums/EBattleEndReason.js";
import { EBattleResult } from "../../models/odyssey/enums/EBattleResult.js";
import { createTestUser, deleteTestUser, makeGameWithEnterableNode, makeGameWithEnterableBoss } from "../../testSupport/odysseyTestSupport.js";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("OdysseyBattleService", () => {
  let userId: string;

  before(async () => {
    userId = await createTestUser("battle");
  });

  after(async () => {
    await deleteTestUser(userId);
  });

  test("test_startBattle_returnsASnapshotSizedToTheNodesDifficultyAndPersistsCurrentNodeId", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 1, ENodeType.Enemy);
    const { game, snapshot, monster } = await OdysseyBattleService.startBattle(userId, 1, node.id);

    assert.strictEqual(game.currentNodeId, node.id);
    assert.strictEqual(snapshot.playerSeconds, snapshot.playerInitialSeconds);
    assert.strictEqual(snapshot.enemySeconds, snapshot.enemyInitialSeconds);
    assert.ok(snapshot.playerInitialSeconds > 0);
    assert.ok(monster.name.length > 0);
  });

  test("test_startBattle_throwsWhenTheNodeIsNotABattleNode", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 2, ENodeType.Rest);
    await assert.rejects(OdysseyBattleService.startBattle(userId, 2, node.id));
  });

  test("test_registerPlayerMove_increasesConfusedOnACheckWithNoPersistence", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 3, ENodeType.Enemy);
    const { snapshot } = await OdysseyBattleService.startBattle(userId, 3, node.id);
    assert.strictEqual(snapshot.botConditions.confused, 0);

    const updated = await OdysseyBattleService.registerPlayerMove(userId, 3, node.id, snapshot, {
      isCheck: true,
      isCapture: false,
    });

    assert.strictEqual(updated.botConditions.confused, 15);
  });

  test(
    "test_computeAiMove_returnsARealMoveFromTheEngine",
    { timeout: 20000 },
    async () => {
      const { node } = await makeGameWithEnterableNode(userId, 4, ENodeType.Enemy);
      const { snapshot } = await OdysseyBattleService.startBattle(userId, 4, node.id);

      const { move } = await OdysseyBattleService.computeAiMove(userId, 4, node.id, snapshot, STARTING_FEN);

      assert.ok(typeof move === "string" && move.length >= 4);
    }
  );

  test("test_applyChargeAction_consumesTheRelicChargeAndPersistsIt", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 5, ENodeType.Enemy);
    const { snapshot } = await OdysseyBattleService.startBattle(userId, 5, node.id);

    const preGame = await OdysseyGameRepository.findBySlot(userId, 5);
    preGame!.relics = [OdysseyRelicFactory.create(ERelicType.Hint, 1)];
    await OdysseyGameRepository.upsert(preGame!);

    const { game } = await OdysseyBattleService.applyChargeAction(userId, 5, node.id, snapshot, ERelicType.Hint);

    assert.strictEqual(game.getRelic(ERelicType.Hint)!.charges, 0);
  });

  test("test_applyChargeAction_throwsWhenNoUsableRelicIsOwned", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 6, ENodeType.Enemy);
    const { snapshot } = await OdysseyBattleService.startBattle(userId, 6, node.id);

    await assert.rejects(OdysseyBattleService.applyChargeAction(userId, 6, node.id, snapshot, ERelicType.Hint));
  });

  test("test_resolveOutcome_awardsCoinsAndCompletesTheNodeOnACheckmateVictory", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 7, ENodeType.Enemy);
    const { game: startedGame, snapshot } = await OdysseyBattleService.startBattle(userId, 7, node.id);
    const startingCoins = startedGame.coins;

    const { game, result, coinsAwarded } = await OdysseyBattleService.resolveOutcome(
      userId,
      7,
      node.id,
      snapshot,
      EBattleEndReason.Checkmate,
      true
    );

    assert.strictEqual(result, EBattleResult.Victory);
    assert.ok(coinsAwarded > 0);
    assert.strictEqual(game.coins, startingCoins + coinsAwarded);
    assert.ok(game.completedNodes.includes(node.id));
    assert.strictEqual(game.journeyComplete, false);
  });

  test("test_resolveOutcome_awardsNoCoinsAndDoesNotCompleteTheNodeOnADefeat", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 8, ENodeType.Enemy);
    const { snapshot } = await OdysseyBattleService.startBattle(userId, 8, node.id);

    const { result, coinsAwarded, game } = await OdysseyBattleService.resolveOutcome(
      userId,
      8,
      node.id,
      snapshot,
      EBattleEndReason.Timeout,
      false
    );

    assert.strictEqual(result, EBattleResult.Defeat);
    assert.strictEqual(coinsAwarded, 0);
    assert.strictEqual(game.completedNodes.includes(node.id), false);
  });

  test("test_resolveOutcome_completesTheJourneyOnABossVictory", async () => {
    const { node } = await makeGameWithEnterableBoss(userId, 9);
    const { snapshot } = await OdysseyBattleService.startBattle(userId, 9, node.id);

    const { game } = await OdysseyBattleService.resolveOutcome(userId, 9, node.id, snapshot, EBattleEndReason.Checkmate, true);

    assert.strictEqual(game.journeyComplete, true);
  });
});
