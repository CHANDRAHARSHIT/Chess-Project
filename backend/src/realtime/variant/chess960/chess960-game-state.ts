import type { GameState } from "../../../contracts/index.js";

/**
 * Opaque state for Chess960 variant.
 * Satisfies GameState (Readonly<Record<string, unknown>>).
 * 
 * FEN is the sole source of truth for board state.
 * Move history is owned exclusively by Session.
 */
export interface Chess960GameState extends Record<string, unknown> {
  readonly fen: string;
  readonly positionId: number; // 0–959
}
