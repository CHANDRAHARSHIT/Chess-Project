import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { OdysseyGameController } from "../odyssey-game.controller.js";
import { OdysseyGameService } from "../../services/odyssey-game.service.js";
import { EPlayerType } from "../../models/odyssey/enums/EPlayerType.js";
import { createTestUser, deleteTestUser, makeMockReq, makeMockRes, makeCapturingNext } from "../../testSupport/odysseyTestSupport.js";

describe("OdysseyGameController", () => {
  let userId: string;

  before(async () => {
    userId = await createTestUser("game-controller");
  });

  after(async () => {
    await deleteTestUser(userId);
  });

  test("test_getSlot_returns401WhenNotAuthenticated", async () => {
    const req = makeMockReq({ params: { slotId: "1" } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyGameController.getSlot(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 401);
    assert.strictEqual((mock.body as any).status, "fail");
  });

  test("test_getSlot_returns400ForANonNumericSlotId", async () => {
    const req = makeMockReq({ userId, params: { slotId: "not-a-number" } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyGameController.getSlot(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 400);
  });

  test("test_getSlot_returns404WhenNoRunExistsForTheSlot", async () => {
    const req = makeMockReq({ userId, params: { slotId: "999" } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyGameController.getSlot(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 404);
  });

  test("test_startNewRun_createsAndReturnsAFreshGame", async () => {
    const req = makeMockReq({ userId, params: { slotId: "1" } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyGameController.startNewRun(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    const game = (mock.body as any).data.game;
    assert.strictEqual(game.coins, 50);
    assert.strictEqual(game.player, null);
  });

  test("test_getSlot_returnsTheGameAfterItHasBeenStarted", async () => {
    await OdysseyGameService.startNewRun(userId, 2);
    const req = makeMockReq({ userId, params: { slotId: "2" } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyGameController.getSlot(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    assert.strictEqual((mock.body as any).data.game.slotId, 2);
  });

  test("test_selectCharacter_returns400ForAnInvalidType", async () => {
    await OdysseyGameService.startNewRun(userId, 3);
    const req = makeMockReq({ userId, params: { slotId: "3" }, body: { type: "wizard" } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyGameController.selectCharacter(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 400);
  });

  test("test_selectCharacter_returns404WhenTheSlotDoesNotExist", async () => {
    const req = makeMockReq({ userId, params: { slotId: "997" }, body: { type: EPlayerType.Strategist } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyGameController.selectCharacter(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 404);
  });

  test("test_selectCharacter_persistsTheChosenPlayerWhenUnlocked", async () => {
    await OdysseyGameService.startNewRun(userId, 4);
    const req = makeMockReq({ userId, params: { slotId: "4" }, body: { type: EPlayerType.Strategist } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyGameController.selectCharacter(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    assert.strictEqual((mock.body as any).data.game.player.type, EPlayerType.Strategist);
  });

  test("test_enterNode_returns400ForANonNumericNodeId", async () => {
    await OdysseyGameService.startNewRun(userId, 5);
    const req = makeMockReq({ userId, params: { slotId: "5", nodeId: "abc" } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyGameController.enterNode(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 400);
  });

  test("test_enterNode_updatesCurrentNodeIdForTheBootstrapAvailableStartNode", async () => {
    await OdysseyGameService.startNewRun(userId, 6);
    const req = makeMockReq({ userId, params: { slotId: "6", nodeId: "0" } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyGameController.enterNode(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    assert.strictEqual((mock.body as any).data.game.currentNodeId, 0);
  });

  test("test_resetRun_returns400WhenKeepProgressIsNotABoolean", async () => {
    await OdysseyGameService.startNewRun(userId, 7);
    const req = makeMockReq({ userId, params: { slotId: "7" }, body: { keepProgress: "yes" } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyGameController.resetRun(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 400);
  });

  test("test_resetRun_clearsProgressWhenKeepProgressIsFalse", async () => {
    await OdysseyGameService.startNewRun(userId, 8);
    await OdysseyGameService.selectCharacter(userId, 8, EPlayerType.Strategist);
    const req = makeMockReq({ userId, params: { slotId: "8" }, body: { keepProgress: false } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyGameController.resetRun(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    assert.strictEqual((mock.body as any).data.game.player, null);
  });

  test("test_deleteSlot_returns404WhenTheSlotDoesNotExist", async () => {
    const req = makeMockReq({ userId, params: { slotId: "996" } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyGameController.deleteSlot(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 404);
  });

  test("test_deleteSlot_removesTheRow", async () => {
    await OdysseyGameService.startNewRun(userId, 9);
    const req = makeMockReq({ userId, params: { slotId: "9" } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyGameController.deleteSlot(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    assert.strictEqual(await OdysseyGameService.getSlot(userId, 9), null);
  });

  test("test_getAllSlots_returnsASummaryForEachStartedSlot", async () => {
    await OdysseyGameService.startNewRun(userId, 10);
    const req = makeMockReq({ userId });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyGameController.getAllSlots(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    const slots = (mock.body as any).data.slots;
    assert.ok(slots.some((s: any) => s.slotId === 10));
  });
});
