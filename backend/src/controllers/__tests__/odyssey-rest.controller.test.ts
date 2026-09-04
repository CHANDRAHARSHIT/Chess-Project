import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { OdysseyRestController } from "../odyssey-rest.controller.js";
import { ENodeType } from "../../models/odyssey/enums/ENodeType.js";
import {
  createTestUser,
  deleteTestUser,
  makeGameWithEnterableNode,
  makeMockReq,
  makeMockRes,
  makeCapturingNext,
} from "../../testSupport/odysseyTestSupport.js";

describe("OdysseyRestController", () => {
  let userId: string;

  before(async () => {
    userId = await createTestUser("rest-controller");
  });

  after(async () => {
    await deleteTestUser(userId);
  });

  test("test_enterRest_returns404WhenTheSlotDoesNotExist", async () => {
    const req = makeMockReq({ userId, params: { slotId: "999", nodeId: "5" } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyRestController.enterRest(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 404);
  });

  test("test_enterRest_rollsAnOutcomeAndPersistsCurrentNodeId", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 1, ENodeType.Rest);
    const req = makeMockReq({ userId, params: { slotId: "1", nodeId: String(node.id) } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyRestController.enterRest(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    const data = (mock.body as any).data;
    assert.strictEqual(data.game.currentNodeId, node.id);
    assert.ok(data.outcome.foundCoins === null || data.outcome.foundRelic === null);
  });

  test("test_applyRest_returns400ForAnInvalidOutcomePayload", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 2, ENodeType.Rest);
    const req = makeMockReq({
      userId,
      params: { slotId: "2", nodeId: String(node.id) },
      body: { outcome: { restores: {}, foundCoins: "twenty", foundRelic: null } },
    });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyRestController.applyRest(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 400);
  });

  test("test_applyRest_appliesTheOutcomeAndCompletesTheNode", async () => {
    const { node, game: startingGame } = await makeGameWithEnterableNode(userId, 3, ENodeType.Rest);
    const req = makeMockReq({
      userId,
      params: { slotId: "3", nodeId: String(node.id) },
      body: { outcome: { restores: {}, foundCoins: 20, foundRelic: null } },
    });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyRestController.applyRest(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    const game = (mock.body as any).data.game;
    assert.strictEqual(game.coins, startingGame.coins + 20);
    assert.ok(game.completedNodes.includes(node.id));
  });
});
