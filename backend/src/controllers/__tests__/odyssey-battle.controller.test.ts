import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { OdysseyBattleController } from "../odyssey-battle.controller.js";
import { OdysseyGameRepository } from "../../repositories/OdysseyGameRepository.js";
import { OdysseyRelicFactory } from "../../models/odyssey/models/OdysseyRelicFactory.js";
import { ERelicType } from "../../models/odyssey/enums/ERelicType.js";
import { ENodeType } from "../../models/odyssey/enums/ENodeType.js";
import { EBattleEndReason } from "../../models/odyssey/enums/EBattleEndReason.js";
import {
  createTestUser,
  deleteTestUser,
  makeGameWithEnterableNode,
  makeMockReq,
  makeMockRes,
  makeCapturingNext,
} from "../../testSupport/odysseyTestSupport.js";

async function startBattle(userId: string, slotId: number, nodeId: number) {
  const req = makeMockReq({ userId, params: { slotId: String(slotId), nodeId: String(nodeId) } });
  const mock = makeMockRes();
  await OdysseyBattleController.startBattle(req, mock.res, makeCapturingNext().next);
  return (mock.body as any).data.snapshot;
}

describe("OdysseyBattleController", () => {
  let userId: string;

  before(async () => {
    userId = await createTestUser("battle-controller");
  });

  after(async () => {
    await deleteTestUser(userId);
  });

  test("test_startBattle_returns404WhenTheSlotDoesNotExist", async () => {
    const req = makeMockReq({ userId, params: { slotId: "999", nodeId: "5" } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyBattleController.startBattle(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 404);
  });

  test("test_startBattle_returnsASnapshotAndAMonster", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 1, ENodeType.Enemy);
    const req = makeMockReq({ userId, params: { slotId: "1", nodeId: String(node.id) } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyBattleController.startBattle(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    const data = (mock.body as any).data;
    assert.ok(data.snapshot.playerInitialSeconds > 0);
    assert.ok(data.monster.name.length > 0);
  });

  test("test_registerPlayerMove_returns400ForAMissingSnapshot", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 2, ENodeType.Enemy);
    const req = makeMockReq({
      userId,
      params: { slotId: "2", nodeId: String(node.id) },
      body: { move: { isCheck: true, isCapture: false } },
    });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyBattleController.registerPlayerMove(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 400);
  });

  test("test_registerPlayerMove_increasesConfusedOnACheck", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 3, ENodeType.Enemy);
    const snapshot = await startBattle(userId, 3, node.id);

    const req = makeMockReq({
      userId,
      params: { slotId: "3", nodeId: String(node.id) },
      body: { snapshot, move: { isCheck: true, isCapture: false } },
    });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyBattleController.registerPlayerMove(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    assert.strictEqual((mock.body as any).data.snapshot.botConditions.confused, 15);
  });

  test("test_applyChargeAction_returns400ForAnInvalidRelicType", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 4, ENodeType.Enemy);
    const snapshot = await startBattle(userId, 4, node.id);

    const req = makeMockReq({
      userId,
      params: { slotId: "4", nodeId: String(node.id) },
      body: { snapshot, relicType: "not-a-relic" },
    });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyBattleController.applyChargeAction(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 400);
  });

  test("test_applyChargeAction_consumesTheRelicChargeAndPersistsIt", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 5, ENodeType.Enemy);
    const snapshot = await startBattle(userId, 5, node.id);

    const game = await OdysseyGameRepository.findBySlot(userId, 5);
    game!.relics = [OdysseyRelicFactory.create(ERelicType.Hint, 1)];
    await OdysseyGameRepository.upsert(game!);

    const req = makeMockReq({
      userId,
      params: { slotId: "5", nodeId: String(node.id) },
      body: { snapshot, relicType: ERelicType.Hint },
    });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyBattleController.applyChargeAction(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    const relic = (mock.body as any).data.game.relics.find((r: any) => r.type === ERelicType.Hint);
    assert.strictEqual(relic.charges, 0);
  });

  test("test_resolveOutcome_returns400ForAnInvalidEndReason", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 6, ENodeType.Enemy);
    const snapshot = await startBattle(userId, 6, node.id);

    const req = makeMockReq({
      userId,
      params: { slotId: "6", nodeId: String(node.id) },
      body: { snapshot, endReason: "resignation", playerWon: true },
    });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyBattleController.resolveOutcome(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 400);
  });

  test("test_resolveOutcome_awardsCoinsAndCompletesTheNodeOnACheckmateVictory", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 7, ENodeType.Enemy);
    const snapshot = await startBattle(userId, 7, node.id);

    const req = makeMockReq({
      userId,
      params: { slotId: "7", nodeId: String(node.id) },
      body: { snapshot, endReason: EBattleEndReason.Checkmate, playerWon: true },
    });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyBattleController.resolveOutcome(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    const data = (mock.body as any).data;
    assert.ok(data.coinsAwarded > 0);
    assert.ok(data.game.completedNodes.includes(node.id));
  });
});
