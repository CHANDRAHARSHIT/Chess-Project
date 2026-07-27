import { prisma } from "../config/prisma.js";

export interface PuzzleFilters {
  themes?: string[];
  minRating?: number;
  maxRating?: number;
  limit?: number;
}

export class PuzzleService {
  /**
   * Returns a de-duplicated, sorted list of all unique theme tags
   * present in the CuratedPuzzle table.
   */
  static async getThemes(): Promise<string[]> {
    // Fetch all distinct theme arrays and flatten them
    const rows = await prisma.curatedPuzzle.findMany({
      select: { themes: true },
    });

    const themeSet = new Set<string>();
    for (const row of rows) {
      for (const theme of row.themes) {
        if (theme) themeSet.add(theme);
      }
    }

    return Array.from(themeSet).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Fetches curated puzzles matching the provided filters,
   * ordered by rating ascending (easiest first for session progression).
   */
  static async getPuzzles(filters: PuzzleFilters = {}) {
    const {
      themes = [],
      minRating = 0,
      maxRating = 3000,
      limit = 50,
    } = filters;

    return await prisma.curatedPuzzle.findMany({
      where: {
        rating: {
          gte: minRating,
          lte: maxRating,
        },
        // When themes are specified, puzzle must have at least one matching theme
        ...(themes.length > 0
          ? {
              themes: {
                hasSome: themes,
              },
            }
          : {}),
      },
      orderBy: { rating: "asc" },
      take: Math.min(limit, 200), // Hard cap to protect against abuse
      select: {
        id: true,
        fen: true,
        moves: true,
        rating: true,
        ratingDeviation: true,
        popularity: true,
        nbPlays: true,
        themes: true,
      },
    });
  }
}
