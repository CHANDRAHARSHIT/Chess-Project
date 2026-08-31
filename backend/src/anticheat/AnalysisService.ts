/**
 * Composition root for post-game analysis, plus the DB↔analysis boundary.
 *
 * Holds one lazily-booted engine for the process — booting Stockfish per request
 * would add ~200ms and a WASM instance to every call.
 */

import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { generateStartingFen } from "../variant/chess960/chess960Rules.js";
import { reportError } from "../observability/index.js";
import { StockfishEngine } from "./detection/engine/StockfishEngine.js";
import { PolicyRegistry } from "./feedback/PolicyRegistry.js";
import {
  GameNotAnalysableError,
  PostGameAnalysis,
  parseStoredMoves,
  startingFenFromMetadata,
  type AnalysableGame,
  type GameAnalysisReport,
} from "./detection/PostGameAnalysis.js";
import { renderTextReport } from "./detection/AnalysisReport.js";
import type { Situation } from "./types.js";

/**
 * Situation for a post-game report.
 *
 * Hardcoded because EligibilityService (which resolves real proficiency) is not
 * implemented, and current matchmaking produces unrated queue games only. The
 * report is descriptive, so a wrong band changes only the quality thresholds,
 * not anyone's standing.
 */
const REPORT_SITUATION: Situation = {
  proficiency: "unknown",
  eventType: "unrated_game",
};

let engine: StockfishEngine | null = null;
let analyser: PostGameAnalysis | null = null;

function getAnalyser(): PostGameAnalysis {
  if (!analyser) {
    engine = new StockfishEngine();
    analyser = new PostGameAnalysis(engine, new PolicyRegistry());
  }
  return analyser;
}

/** Releases the engine. For test teardown and graceful shutdown. */
export function shutdownAnalysis(): void {
  engine?.quit();
  engine = null;
  analyser = null;
}

/** Loads a GameRecord and reshapes it for analysis. Null when the game doesn't exist. */
export async function loadAnalysableGame(gameRecordId: string): Promise<AnalysableGame | null> {
  const record = await prisma.gameRecord.findUnique({
    where: { id: gameRecordId },
    include: { participants: { include: { user: { select: { name: true } } } } },
  });
  if (!record) return null;

  const startingFen = startingFenFromMetadata(record.metadata, generateStartingFen);
  if (!startingFen) {
    throw new GameNotAnalysableError(
      "This game predates starting-position capture, so it cannot be replayed. " +
        "Games played from now on will analyse correctly."
    );
  }

  return {
    gameRecordId: record.id,
    variantId: record.variantId,
    startingFen,
    moves: parseStoredMoves(record.moveHistory),
    participants: record.participants.map((p) => ({
      userId: p.userId,
      side: p.side,
      ...(p.user?.name ? { name: p.user.name } : {}),
    })),
    endedAt: record.endedAt,
    terminationReason: record.terminationReason,
    outcomeKind: record.outcomeKind,
    winningSide: record.winningSide,
  };
}

/** Analyses a stored game. Throws GameNotAnalysableError when the record can't support it. */
export async function analyseGame(gameRecordId: string): Promise<GameAnalysisReport> {
  const game = await loadAnalysableGame(gameRecordId);
  if (!game) throw new GameNotAnalysableError(`Game '${gameRecordId}' not found.`);
  return getAnalyser().analyse(game, REPORT_SITUATION);
}

/** Analyses a game and renders the plain-text report. */
export async function analyseGameAsText(gameRecordId: string): Promise<string> {
  return renderTextReport(await analyseGame(gameRecordId));
}

/** Maps a session id to its persisted record id. Null when Results hasn't written it. */
async function resolveRecordId(gameSessionId: string): Promise<string | null> {
  const record = await prisma.gameRecord.findUnique({
    where: { gameSessionId },
    select: { id: true },
  });
  return record?.id ?? null;
}

/**
 * Fire-and-forget hook for game completion, keyed by session rather than record
 * id — Results persists the record without returning its id.
 *
 * Mirrors the Session → Results decoupling: analysis failure must never affect
 * the game that just ended, so every error is swallowed after reporting.
 */
export function analyseOnGameCompleted(gameSessionId: string): void {
  if (!env.ANTICHEAT_ENABLED) return;

  resolveRecordId(gameSessionId)
    .then(async (gameRecordId) => {
      if (!gameRecordId) return;
      console.log(`\n${await analyseGameAsText(gameRecordId)}\n`);
    })
    .catch((err) => {
      const gameRecordId = gameSessionId;
      if (err instanceof GameNotAnalysableError) {
        console.warn(`[anticheat] Skipped analysis for ${gameRecordId}: ${err.message}`);
        return;
      }
      reportError({
        domain: "anticheat",
        error: err as Error,
        fatal: false,
        context: { gameRecordId, reason: "post_game_analysis_failed" },
      });
    });
}

export { GameNotAnalysableError };
export type { GameAnalysisReport };
