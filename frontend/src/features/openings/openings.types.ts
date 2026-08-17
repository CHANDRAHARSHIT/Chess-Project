/**
 * opening.ts
 * Shared TypeScript types for the Openings feature.
 * Reflects the backend Opening Prisma model exactly.
 */

/** A single opening record as returned by GET /api/openings */
export interface Opening {
  id: string;
  eco: string;
  name: string;
  /** Full PGN string, e.g. "1. e4 e5 2. Nf3 Nc6 3. Bc4" */
  pgn: string;
  /** Space-separated SAN moves, e.g. "e4 e5 Nf3 Nc6 Bc4" */
  moves: string;
}

/** API response wrapper for the list endpoint */
export interface OpeningsListResponse {
  status: "success" | "fail" | "error";
  data: {
    openings: Opening[];
  };
}

/** API response wrapper for the single-opening endpoint */
export interface OpeningResponse {
  status: "success" | "fail" | "error";
  data: {
    opening: Opening;
  };
}
