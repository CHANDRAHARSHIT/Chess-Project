import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { OdysseyPuzzleService } from "../odyssey-puzzle.service.js";
import { OdysseyGameService } from "../odyssey-game.service.js";
import { OdysseyGameRepository } from "../../repositories/OdysseyGameRepository.js";
import { OdysseyPuzzleNode } from "../../models/odyssey/models/OdysseyPuzzleNode.js";
import { ENodeType } from "../../models/odyssey/enums/ENodeType.js";
import { createTestUser, deleteTestUser, makeGameWithEnterableNode } from "../../testSupport/odysseyTestSupport.js";

describe("OdysseyPuzzleService", () => {
  let userId: string;

  before(async () => {
    userId = await createTestUser("puzzle");
  });

  after(async () => {
    await deleteTestUser(userId);
  });

  test("test_enterPuzzle_returnsAnEncounterWithAtMostFivePuzzlesInTheNodesRatingBand", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 1, ENodeType.Puzzle);
    const { game, encounter } = await OdysseyPuzzleService.enterPuzzle(userId, 1, node.id);

    assert.strictEqual(game.currentNodeId, node.id);
    assert.ok(encounter.puzzles.length <= 5);
    assert.ok(encounter.maxRating > encounter.minRating);
  });

  test("test_resolvePuzzle_awardsCoinsAndCompletesTheNodeOnAFullClear", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 2, ENodeType.Puzzle);
    const { game: startedGame } = await OdysseyPuzzleService.enterPuzzle(userId, 2, node.id);
    const startingCoins = startedGame.coins;

    const totalCount = 3;
    const { game, coinsAwarded } = await OdysseyPuzzleService.resolvePuzzle(userId, 2, node.id, totalCount, totalCount);

    assert.ok(coinsAwarded > 0);
    assert.strictEqual(game.coins, startingCoins + coinsAwarded);
    assert.ok(game.completedNodes.includes(node.id));
  });

  test("test_resolvePuzzle_awardsNoCoinsAndDoesNotCompleteTheNodeOnAPartialClear", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 3, ENodeType.Puzzle);
    await OdysseyPuzzleService.enterPuzzle(userId, 3, node.id);

    const { game, coinsAwarded } = await OdysseyPuzzleService.resolvePuzzle(userId, 3, node.id, 2, 3);

    assert.strictEqual(coinsAwarded, 0);
    assert.strictEqual(game.completedNodes.includes(node.id), false);
  });

  test("test_resolvePuzzle_throwsForANodeThatWasNeverMadeReachable", async () => {
    const game = await OdysseyGameService.startNewRun(userId, 4);
    const startNode = game.map.getNode(0)!;
    const unreachable = game.map.nodes.find(
      n => n instanceof OdysseyPuzzleNode && !startNode.isAdjacentTo(n.id)
    ) as OdysseyPuzzleNode | undefined;
    assert.ok(unreachable, "expected a puzzle node beyond floor 1 in a freshly generated map");

    await assert.rejects(OdysseyPuzzleService.resolvePuzzle(userId, 4, unreachable!.id, 3, 3));

    const reloaded = await OdysseyGameRepository.findBySlot(userId, 4);
    assert.strictEqual(reloaded!.completedNodes.includes(unreachable!.id), false);
  });
});
