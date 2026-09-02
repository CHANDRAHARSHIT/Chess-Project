/**
 * Read/write boundary for cached per-game engine analysis (`GameAnalysis`).
 *
 * Written once per game by post-game analysis; read by multi-game suspect
 * review, which never runs the engine itself.
 *
 * Only raw engine output is stored. Classification depends on PolicyRegistry
 * values the Feedback module changes, so persisting it would mean re-running
 * Stockfish across the whole history on every policy edit. See
 * ./MULTI_GAME_REVIEW_REQUIREMENTS.md §11.2.1.
 */

import { prisma } from "../config/prisma.js";
import type { AnalyzedMove } from "./types.js";

/**
 * Bumped whenever the stored ply shape changes, so rows written by an older
 * build are re-analysed rather than silently misread.
 */
export const PERSISTED_PAYLOAD_VERSION = 1;

/** One ply as stored. Raw engine output only — nothing policy-dependent. */
export interface PersistedPly {
  readonly ply: number;
  readonly side: number;
  readonly san: string;
  readonly uci?: string;
  readonly evalBeforeCp: number;
  readonly evalAfterCp: number;
  readonly bestMove?: string;
  readonly legalMoveCount: number;
}

export interface StoredGameAnalysis {
  readonly gameRecordId: string;
  readonly engineName: string;
  readonly engineDepth: number;
  readonly startingFen: string;
  readonly plies: readonly PersistedPly[];
}

/**
 * Drops plies the engine could not evaluate. A ply with no evaluation supports
 * no signal, and storing it as zero would read as a level position.
 */
export function buildPersistedPlies(moves: readonly AnalyzedMove[]): PersistedPly[] {
  return moves
    .filter((move) => move.evalBeforeCp !== undefined && move.evalAfterCp !== undefined)
    .map((move) => ({
      ply: move.ply,
      side: move.side,
      san: move.san,
      ...(move.uci ? { uci: move.uci } : {}),
      evalBeforeCp: move.evalBeforeCp!,
      evalAfterCp: move.evalAfterCp!,
      ...(move.engineBestMoves?.[0] ? { bestMove: move.engineBestMoves[0] } : {}),
      legalMoveCount: move.legalMoveCount ?? 0,
    }));
}

/** Upserts, so re-analysing a game replaces its cached row rather than failing. */
export async function saveGameAnalysis(analysis: StoredGameAnalysis): Promise<void> {
  const row = {
    engineName: analysis.engineName,
    engineDepth: analysis.engineDepth,
    startingFen: analysis.startingFen,
    plyCount: analysis.plies.length,
    plies: analysis.plies as unknown as object[],
    payloadVersion: PERSISTED_PAYLOAD_VERSION,
    analysedAt: new Date(),
  };

  await prisma.gameAnalysis.upsert({
    where: { gameRecordId: analysis.gameRecordId },
    create: { gameRecordId: analysis.gameRecordId, ...row },
    update: row,
  });
}

/**
 * Null when the game has never been analysed, or was analysed under an older
 * payload version — both mean "run the engine", not "assume empty".
 */
export async function findGameAnalysis(
  gameRecordId: string
): Promise<StoredGameAnalysis | null> {
  const record = await prisma.gameAnalysis.findUnique({ where: { gameRecordId } });
  if (!record || record.payloadVersion !== PERSISTED_PAYLOAD_VERSION) return null;

  return {
    gameRecordId: record.gameRecordId,
    engineName: record.engineName,
    engineDepth: record.engineDepth,
    startingFen: record.startingFen,
    plies: record.plies as unknown as PersistedPly[],
  };
}
