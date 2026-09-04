import { EDifficulty } from "../enums/EDifficulty.js";
import type { OdysseyPuzzleNode } from "./OdysseyPuzzleNode.js";
import type { OdysseyGame } from "./OdysseyGame.js";

const PUZZLES_PER_NODE = 5;
const COINS_PER_DIFFICULTY_LEVEL = 20;
const NO_REWARD_COINS = 0;

const BEGINNER_MIN_RATING = 800;
const RATING_BAND_WIDTH = 400;
const EASY_MIN_RATING = BEGINNER_MIN_RATING + RATING_BAND_WIDTH; // 1200
const INTERMEDIATE_MIN_RATING = EASY_MIN_RATING + RATING_BAND_WIDTH; // 1600
const ADVANCED_MIN_RATING = INTERMEDIATE_MIN_RATING + RATING_BAND_WIDTH; // 2000

const SHUFFLE_COMPARATOR_MIDPOINT = 0.5;

function ratingBandFor(difficulty: EDifficulty): { minRating: number; maxRating: number } {
  const minRating =
    difficulty === EDifficulty.Beginner
      ? BEGINNER_MIN_RATING
      : difficulty === EDifficulty.Easy
        ? EASY_MIN_RATING
        : difficulty === EDifficulty.Intermediate
          ? INTERMEDIATE_MIN_RATING
          : ADVANCED_MIN_RATING;
  return { minRating, maxRating: minRating + RATING_BAND_WIDTH };
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => SHUFFLE_COMPARATOR_MIDPOINT - Math.random());
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
      return { coinsAwarded: NO_REWARD_COINS };
    }
    const coinsAwarded = this.node.difficulty * COINS_PER_DIFFICULTY_LEVEL;
    game.addCoins(coinsAwarded);
    return { coinsAwarded };
  }
}
