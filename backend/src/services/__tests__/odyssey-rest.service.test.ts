import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { OdysseyRestService } from "../odyssey-rest.service.js";
import { OdysseyGameService } from "../odyssey-game.service.js";
import { OdysseyGameRepository } from "../../repositories/OdysseyGameRepository.js";
import { ENodeType } from "../../models/odyssey/enums/ENodeType.js";
import { createTestUser, deleteTestUser, makeGameWithEnterableNode } from "../../testSupport/odysseyTestSupport.js";

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

  test("test_applyRest_throwsForANodeThatWasNeverMadeReachable", async () => {
    const game = await OdysseyGameService.startNewRun(userId, 3);
    const startNode = game.map.getNode(0)!;
    const unreachable = game.map.nodes.find(n => n.id !== 0 && !startNode.isAdjacentTo(n.id));
    assert.ok(unreachable, "expected a node beyond floor 1 in a freshly generated map");

    await assert.rejects(
      OdysseyRestService.applyRest(userId, 3, unreachable!.id, { restores: {}, foundCoins: 20, foundRelic: null })
    );

    const reloaded = await OdysseyGameRepository.findBySlot(userId, 3);
    assert.strictEqual(reloaded!.completedNodes.includes(unreachable!.id), false);
    assert.strictEqual(reloaded!.coins, 50); // no reward applied either
  });
});
