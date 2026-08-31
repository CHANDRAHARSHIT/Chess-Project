import { EDifficulty } from "../enums/EDifficulty.js";
import type { OdysseyPuzzleNode } from "./OdysseyPuzzleNode.js";
import type { OdysseyGame } from "./OdysseyGame.js";

const PUZZLES_PER_NODE = 5;

function ratingBandFor(difficulty: EDifficulty): { minRating: number; maxRating: number } {
  const minRating =
    difficulty === EDifficulty.Beginner
      ? 800
      : difficulty === EDifficulty.Easy
        ? 1200
        : difficulty === EDifficulty.Intermediate
          ? 1600
          : 2000;
  return { minRating, maxRating: minRating + 400 };
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => 0.5 - Math.random());
}

/**
 * The live puzzle-solving session opened against an OdysseyPuzzleNode.
 * Reuses the EXISTING PuzzleService (backend/src/services/puzzle.service.ts)
 * — no new puzzle storage needed, only this story-mode-specific
 * selection/reward wrapper around it.
 */
export class OdysseyPuzzleEncounter {
  readonly node: OdysseyPuzzleNode;
  readonly minRating: number;
  readonly maxRating: number;
  puzzles: unknown[]; // CuratedPuzzle[], up to 5 — see existing PuzzleService for the real shape
  usedFallback: boolean; // true if the DB query returned 0 rows and local FALLBACK_PUZZLES was used

  private constructor(node: OdysseyPuzzleNode, minRating: number, maxRating: number, puzzles: unknown[], usedFallback: boolean) {
    this.node = node;
    this.minRating = minRating;
    this.maxRating = maxRating;
    this.puzzles = puzzles;
    this.usedFallback = usedFallback;
  }

  /**
   * Difficulty -> rating band (exact port):
   *   Beginner -> [800, 1200)   Easy -> [1200, 1600)
   *   Intermediate -> [1600, 2000)   Advanced+ -> [2000, 2400)
   *
   * `fetchPuzzles` is injected (it wraps the existing PuzzleService.getPuzzles
   * call, which lives outside this model layer) rather than imported
   * directly, so this class stays free of a dependency on the real
   * backend's module graph. Shuffles the result and takes up to 5. Falls
   * back to `fallbackPuzzles` only when the query returns zero rows (not
   * on request failure — a failure should propagate as an error).
   */
  static async open(
    node: OdysseyPuzzleNode,
    fetchPuzzles: (minRating: number, maxRating: number) => Promise<unknown[]>,
    fallbackPuzzles: unknown[] = []
  ): Promise<OdysseyPuzzleEncounter> {
    const { minRating, maxRating } = ratingBandFor(node.difficulty);

    let source = await fetchPuzzles(minRating, maxRating);
    let usedFallback = false;
    if (source.length === 0) {
      source = fallbackPuzzles;
      usedFallback = true;
    }

    const puzzles = shuffle(source).slice(0, PUZZLES_PER_NODE);
    return new OdysseyPuzzleEncounter(node, minRating, maxRating, puzzles, usedFallback);
  }

  /**
   * All-or-nothing reward applied to `game`: node.difficulty * 20 coins,
   * awarded ONLY when solvedCount === this.puzzles.length (no partial
   * credit). Retreating mid-set loses all progress on that node.
   */
  resolveReward(solvedCount: number, game: OdysseyGame): { coinsAwarded: number } {
    if (solvedCount !== this.puzzles.length) {
      return { coinsAwarded: 0 };
    }
    const coinsAwarded = this.node.difficulty * 20;
    game.addCoins(coinsAwarded);
    return { coinsAwarded };
  }
}
