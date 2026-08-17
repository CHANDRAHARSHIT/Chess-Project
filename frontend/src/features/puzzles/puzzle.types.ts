/**
 * Types for the Custom Puzzles feature.
 * Mirrors the CuratedPuzzle Prisma model (excluding metadata fields).
 */

export interface CuratedPuzzle {
  id: string;
  fen: string;
  /** Space-separated UCI move list — the puzzle solution sequence. */
  moves: string;
  rating: number;
  ratingDeviation: number;
  popularity: number;
  nbPlays: number;
  themes: string[];
}

export interface PuzzleFilters {
  themes?: string[];
  minRating?: number;
  maxRating?: number;
  limit?: number;
}

export interface GetPuzzlesResponse {
  status: "success" | "fail";
  message?: string;
  data?: {
    count: number;
    puzzles: CuratedPuzzle[];
  };
}

export interface GetThemesResponse {
  status: "success" | "fail";
  message?: string;
  data?: {
    themes: string[];
  };
}
