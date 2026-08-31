import type { OdysseyPuzzleNode } from "./OdysseyPuzzleNode.js";
import type { OdysseyPlayer } from "./OdysseyPlayer.js";

/**
 * The live puzzle-solving session opened against an OdysseyPuzzleNode.
 * Reuses the EXISTING PuzzleService (backend/src/services/puzzle.service.ts)
 * — no new puzzle storage needed, only this story-mode-specific
 * selection/reward wrapper around it.
 */
export class OdysseyPuzzleEncounter {
  readonly node!: OdysseyPuzzleNode;
  readonly minRating!: number;
  readonly maxRating!: number;
  puzzles!: unknown[]; // CuratedPuzzle[], up to 5 — see existing PuzzleService for the real shape
  usedFallback!: boolean; // true if the DB query returned 0 rows and local FALLBACK_PUZZLES was used

  /**
   * Difficulty -> rating band (exact port):
   *   Beginner -> [800, 1200)   Easy -> [1200, 1600)
   *   Intermediate -> [1600, 2000)   Advanced+ -> [2000, 2400)
   *
   * Then calls the existing PuzzleService.getPuzzles({minRating,maxRating}),
   * shuffles the result and takes up to 5. Falls back to a fixed local
   * puzzle set only when the query returns zero rows (not on request
   * failure — a failure should propagate as an error).
   */
  static async open(node: OdysseyPuzzleNode): Promise<OdysseyPuzzleEncounter> {
    throw new Error("Not implemented");
  }

  /**
   * All-or-nothing reward applied to `player`: node.difficulty * 20 coins,
   * awarded ONLY when solvedCount === this.puzzles.length (no partial
   * credit). Retreating mid-set loses all progress on that node.
   */
  resolveReward(solvedCount: number, player: OdysseyPlayer): { coinsAwarded: number } {
    throw new Error("Not implemented");
  }
}
