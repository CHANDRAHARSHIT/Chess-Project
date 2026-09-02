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
import type { ReviewWindowPolicy } from "./feedback/PolicyRegistry.js";

/**
 * Bumped whenever the stored ply shape changes, so rows written by an older
 * build are re-analysed rather than silently misread.
 */
export const PERSISTED_PAYLOAD_VERSION = 1;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

/** One of the suspect's games, already analysed, as the review window needs it. */
export interface ReviewCandidate {
  readonly gameRecordId: string;
  /** The suspect's side in this game, so only their plies are scored. */
  readonly side: number;
  readonly endedAt: Date;
  readonly engineName: string;
  readonly engineDepth: number;
  readonly plies: readonly PersistedPly[];
}

/**
 * The suspect's most recent games eligible for review, newest first.
 *
 * Bot games are excluded by provenance, which also means a bot account can
 * never be reviewed: bots only ever play bot-provenance games, so they qualify
 * for nothing and fail the sufficiency check on their own.
 *
 * Games with no cached analysis are skipped rather than analysed here — a
 * review must never trigger engine work.
 */
export async function findReviewCandidates(
  userId: string,
  policy: ReviewWindowPolicy
): Promise<ReviewCandidate[]> {
  const oldestAllowed = new Date(Date.now() - policy.maxAgeDays * MS_PER_DAY);

  const participations = await prisma.gameParticipant.findMany({
    where: {
      userId,
      gameRecord: {
        endedAt: { gte: oldestAllowed },
        variantId: { in: [...policy.variantIds] },
        moveCount: { gte: policy.minMovesPerGame },
        initialSeconds: policy.initialSeconds,
        incrementSeconds: policy.incrementSeconds,
        analysis: { isNot: null },
        ...(policy.includeBotGames ? {} : { provenance: { not: "bot" } }),
      },
    },
    include: { gameRecord: { include: { analysis: true } } },
    orderBy: { gameRecord: { endedAt: "desc" } },
    take: policy.gameCount,
  });

  return participations.flatMap((participation) => {
    const { analysis, endedAt } = participation.gameRecord;
    // Narrowing only: the query already required a non-null analysis.
    if (!analysis || analysis.payloadVersion !== PERSISTED_PAYLOAD_VERSION) return [];

    return [
      {
        gameRecordId: participation.gameRecordId,
        side: participation.side,
        endedAt,
        engineName: analysis.engineName,
        engineDepth: analysis.engineDepth,
        plies: analysis.plies as unknown as PersistedPly[],
      },
    ];
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
