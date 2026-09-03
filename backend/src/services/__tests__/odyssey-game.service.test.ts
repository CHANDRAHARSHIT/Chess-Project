import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { OdysseyGameService } from "../odyssey-game.service.js";
import { OdysseyGameRepository } from "../../repositories/OdysseyGameRepository.js";
import { EPlayerType } from "../../models/odyssey/enums/EPlayerType.js";
import { createTestUser, deleteTestUser } from "./odysseyServiceTestSupport.js";

describe("OdysseyGameService", () => {
  let userId: string;

  before(async () => {
    userId = await createTestUser("game");
  });

  after(async () => {
    await deleteTestUser(userId);
  });

  test("test_startNewRun_persistsAFreshGameWithDefaultCoinsAndNoPlayer", async () => {
    const game = await OdysseyGameService.startNewRun(userId, 1);
    assert.strictEqual(game.coins, 50);
    assert.strictEqual(game.player, null);
    assert.strictEqual(game.journeyComplete, false);
    assert.deepStrictEqual(game.completedNodes, []);
    assert.ok(game.map.nodes.length > 0);
  });

  test("test_getSlot_returnsNullWhenNoRunExistsForTheSlot", async () => {
    const result = await OdysseyGameService.getSlot(userId, 999);
    assert.strictEqual(result, null);
  });

  test("test_getSlot_returnsThePersistedGameAfterStartNewRun", async () => {
    await OdysseyGameService.startNewRun(userId, 2);
    const result = await OdysseyGameService.getSlot(userId, 2);
    assert.ok(result);
    assert.strictEqual(result!.slotId, 2);
  });

  test("test_requireSlot_throwsWhenNoRunExistsForTheSlot", async () => {
    await assert.rejects(OdysseyGameService.requireSlot(userId, 998));
  });

  test("test_selectCharacter_persistsTheChosenPlayerWhenUnlocked", async () => {
    await OdysseyGameService.startNewRun(userId, 3);
    const game = await OdysseyGameService.selectCharacter(userId, 3, EPlayerType.Strategist);
    assert.strictEqual(game.player?.type, EPlayerType.Strategist);

    const reloaded = await OdysseyGameRepository.findBySlot(userId, 3);
    assert.strictEqual(reloaded!.player?.type, EPlayerType.Strategist);
  });

  test("test_selectCharacter_doesNothingWhenTheTypeIsLocked", async () => {
    await OdysseyGameService.startNewRun(userId, 4);
    const game = await OdysseyGameService.selectCharacter(userId, 4, EPlayerType.Rook);
    assert.strictEqual(game.player, null);
  });

  test("test_enterNode_updatesCurrentNodeIdForTheBootstrapAvailableStartNode", async () => {
    await OdysseyGameService.startNewRun(userId, 5);
    const game = await OdysseyGameService.enterNode(userId, 5, 0);
    assert.strictEqual(game.currentNodeId, 0);
  });

  test("test_enterNode_throwsWhenTheNodeIsNotCurrentlyEnterable", async () => {
    const freshGame = await OdysseyGameService.startNewRun(userId, 6);
    const startNode = freshGame.map.getNode(0)!;
    const unreachable = freshGame.map.nodes.find(n => n.id !== 0 && !startNode.isAdjacentTo(n.id));
    assert.ok(unreachable, "expected at least one node beyond floor 1 in a freshly generated map");
    await assert.rejects(OdysseyGameService.enterNode(userId, 6, unreachable!.id));
  });

  test("test_resetRun_keepsCoinsAndPlayerWhenKeepProgressIsTrue", async () => {
    await OdysseyGameService.startNewRun(userId, 7);
    await OdysseyGameService.selectCharacter(userId, 7, EPlayerType.Strategist);
    const beforeReset = await OdysseyGameService.requireSlot(userId, 7);
    beforeReset.coins = 777;
    await OdysseyGameRepository.upsert(beforeReset);

    const game = await OdysseyGameService.resetRun(userId, 7, true);
    assert.strictEqual(game.coins, 777);
    assert.strictEqual(game.player?.type, EPlayerType.Strategist);
    assert.deepStrictEqual(game.completedNodes, []);
  });

  test("test_resetRun_clearsCoinsAndPlayerWhenKeepProgressIsFalse", async () => {
    await OdysseyGameService.startNewRun(userId, 8);
    await OdysseyGameService.selectCharacter(userId, 8, EPlayerType.Strategist);

    const game = await OdysseyGameService.resetRun(userId, 8, false);
    assert.strictEqual(game.coins, 50);
    assert.strictEqual(game.player, null);
  });

  test("test_getAllSlotSummaries_reflectsProgressForEachSlot", async () => {
    const game = await OdysseyGameService.startNewRun(userId, 9);
    game.completedNodes = [0];
    await OdysseyGameRepository.upsert(game);

    const summaries = await OdysseyGameService.getAllSlotSummaries(userId);
    const slot9 = summaries.find(s => s.slotId === 9);
    assert.ok(slot9);
    assert.ok(slot9!.progressPercent > 0);
  });

  test("test_deleteSlot_removesTheRow", async () => {
    await OdysseyGameService.startNewRun(userId, 10);
    await OdysseyGameService.deleteSlot(userId, 10);
    const result = await OdysseyGameService.getSlot(userId, 10);
    assert.strictEqual(result, null);
  });
});
