import { OdysseyGameRepository } from "../repositories/OdysseyGameRepository.js";
import { OdysseyGameService } from "./odyssey-game.service.js";
import { PuzzleService } from "./puzzle.service.js";
import { OdysseyPuzzleEncounter } from "../models/odyssey/models/OdysseyPuzzleEncounter.js";
import { OdysseyPuzzleNode } from "../models/odyssey/models/OdysseyPuzzleNode.js";
import type { OdysseyGame } from "../models/odyssey/models/OdysseyGame.js";

function getPuzzleNode(game: OdysseyGame, nodeId: number): OdysseyPuzzleNode {
  const node = game.map.getNode(nodeId);
  if (!(node instanceof OdysseyPuzzleNode)) {
    throw new Error(`Node ${nodeId} is not a puzzle node.`);
  }
  return node;
}

export class OdysseyPuzzleService {
  /**
   * Enters a puzzle node and fetches its puzzle set from the existing
   * curated-puzzle database via PuzzleService — no new puzzle storage for
   * Odyssey. NOTE: no local fallback puzzle content has been ported yet
   * (the frontend's FALLBACK_PUZZLES); if a rating band has zero rows,
   * `usedFallback` comes back true with an empty set — flagged as a known
   * gap rather than fabricated content.
   */
  static async enterPuzzle(userId: string, slotId: number, nodeId: number): Promise<{ game: OdysseyGame; encounter: OdysseyPuzzleEncounter }> {
    const game = await OdysseyGameService.enterNode(userId, slotId, nodeId);
    const node = getPuzzleNode(game, nodeId);
    const encounter = await OdysseyPuzzleEncounter.open(
      node,
      (minRating, maxRating) => PuzzleService.getPuzzles({ minRating, maxRating }),
      []
    );
    return { game, encounter };
  }

  /**
   * Awards the all-or-nothing reward and completes the node on a full
   * clear. The puzzle set itself isn't persisted, so `totalCount` is
   * resent from what enterPuzzle returned; this rebuilds an encounter of
   * the same shape purely to reuse OdysseyPuzzleEncounter.resolveReward()'s
   * formula rather than re-deriving `difficulty * 20` here.
   */
  static async resolvePuzzle(
    userId: string,
    slotId: number,
    nodeId: number,
    solvedCount: number,
    totalCount: number
  ): Promise<{ game: OdysseyGame; coinsAwarded: number }> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    if (!game.canEnterNode(nodeId)) {
      throw new Error(`Node ${nodeId} is not currently reachable for this run — refusing to resolve it.`);
    }
    const node = getPuzzleNode(game, nodeId);
    const encounter = await OdysseyPuzzleEncounter.open(
      node,
      async () => new Array(totalCount).fill(null),
      new Array(totalCount).fill(null)
    );
    const { coinsAwarded } = encounter.resolveReward(solvedCount, game);
    if (coinsAwarded > 0) {
      game.completeNode(nodeId, false); // a puzzle node is never the boss
    }
    const savedGame = await OdysseyGameRepository.upsert(game);
    return { game: savedGame, coinsAwarded };
  }
}
