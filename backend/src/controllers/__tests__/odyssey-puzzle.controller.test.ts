import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { OdysseyPuzzleController } from "../odyssey-puzzle.controller.js";
import { ENodeType } from "../../models/odyssey/enums/ENodeType.js";
import {
  createTestUser,
  deleteTestUser,
  makeGameWithEnterableNode,
  makeMockReq,
  makeMockRes,
  makeCapturingNext,
} from "../../testSupport/odysseyTestSupport.js";

describe("OdysseyPuzzleController", () => {
  let userId: string;

  before(async () => {
    userId = await createTestUser("puzzle-controller");
  });

  after(async () => {
    await deleteTestUser(userId);
  });

  test("test_enterPuzzle_returns404WhenTheSlotDoesNotExist", async () => {
    const req = makeMockReq({ userId, params: { slotId: "999", nodeId: "5" } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyPuzzleController.enterPuzzle(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 404);
  });

  test("test_enterPuzzle_returnsAnEncounterWithAtMostFivePuzzles", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 1, ENodeType.Puzzle);
    const req = makeMockReq({ userId, params: { slotId: "1", nodeId: String(node.id) } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyPuzzleController.enterPuzzle(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    assert.ok((mock.body as any).data.encounter.puzzles.length <= 5);
  });

  test("test_resolvePuzzle_returns400ForANegativeSolvedCount", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 2, ENodeType.Puzzle);
    const req = makeMockReq({
      userId,
      params: { slotId: "2", nodeId: String(node.id) },
      body: { solvedCount: -1, totalCount: 3 },
    });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyPuzzleController.resolvePuzzle(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 400);
  });

  test("test_resolvePuzzle_awardsCoinsAndCompletesTheNodeOnAFullClear", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 3, ENodeType.Puzzle);
    const enterReq = makeMockReq({ userId, params: { slotId: "3", nodeId: String(node.id) } });
    await OdysseyPuzzleController.enterPuzzle(enterReq, makeMockRes().res, makeCapturingNext().next);

    const req = makeMockReq({
      userId,
      params: { slotId: "3", nodeId: String(node.id) },
      body: { solvedCount: 3, totalCount: 3 },
    });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyPuzzleController.resolvePuzzle(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    const data = (mock.body as any).data;
    assert.ok(data.coinsAwarded > 0);
    assert.ok(data.game.completedNodes.includes(node.id));
  });
});
