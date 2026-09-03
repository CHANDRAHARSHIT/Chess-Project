import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { OdysseyRestService } from "../odyssey-rest.service.js";
import { ENodeType } from "../../models/odyssey/enums/ENodeType.js";
import { createTestUser, deleteTestUser, makeGameWithEnterableNode } from "./odysseyServiceTestSupport.js";

describe("OdysseyRestService", () => {
  let userId: string;

  before(async () => {
    userId = await createTestUser("rest");
  });

  after(async () => {
    await deleteTestUser(userId);
  });

  test("test_enterRest_rollsAnOutcomeAndPersistsCurrentNodeId", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 1, ENodeType.Rest);
    const { game, outcome } = await OdysseyRestService.enterRest(userId, 1, node.id);

    assert.strictEqual(game.currentNodeId, node.id);
    const totalRestored = Object.values(outcome.restores).reduce((sum, points) => sum + points, 0);
    assert.ok(totalRestored <= 5);
    assert.ok(outcome.foundCoins === null || outcome.foundRelic === null); // mutually exclusive
  });

  test("test_applyRest_appliesTheGivenOutcomeAndCompletesTheNode", async () => {
    const { game: freshGame, node } = await makeGameWithEnterableNode(userId, 2, ENodeType.Rest);
    const startingCoins = freshGame.coins;

    const game = await OdysseyRestService.applyRest(userId, 2, node.id, {
      restores: {},
      foundCoins: 20,
      foundRelic: null,
    });

    assert.strictEqual(game.coins, startingCoins + 20);
    assert.ok(game.completedNodes.includes(node.id));
  });
});
