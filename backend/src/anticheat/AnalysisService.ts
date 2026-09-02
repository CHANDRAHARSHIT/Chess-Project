/**
 * Composition root for post-game analysis, plus the DB↔analysis boundary.
 *
 * Holds one lazily-booted engine for the process — booting Stockfish per request
 * would add ~200ms and a WASM instance to every call.
 */

import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { generateStartingFen } from "../variant/chess960/chess960Rules.js";
import { ENGINE_NAME, StockfishEngine } from "./detection/engine/StockfishEngine.js";
import {
  buildPersistedPlies,
  findReviewCandidates,
  saveGameAnalysis,
} from "./analysisRepository.js";
import { buildReviewWindow, type ReviewWindow } from "./detection/ReviewWindow.js";
import { scoreReviewWindow } from "./detection/ReviewScoring.js";
import { StatisticalBaselines } from "./detection/StatisticalBaselines.js";
import { PolicyRegistry } from "./feedback/PolicyRegistry.js";
import {
  GameNotAnalysableError,
  PostGameAnalysis,
  parseStoredMoves,
  startingFenFromMetadata,
  type AnalysableGame,
  type GameAnalysisReport,
} from "./detection/PostGameAnalysis.js";
import { renderReviewSummary, renderTextReport } from "./detection/AnalysisReport.js";
import type { DetectionOutcome, Situation } from "./types.js";

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
 * Post-game blunder review for a finished game, keyed by session rather than
 * record id — Results persists the record without returning its id.
 *
 * Registered as the `blunder_analysis` action, so the event manager owns
 * isolation and error reporting: a failure here can never reach the game that
 * just ended.
 */
export async function runBlunderAnalysis(gameSessionId: string): Promise<void> {
  if (!env.ANTICHEAT_ENABLED) return;

  const gameRecordId = await resolveRecordId(gameSessionId);
  if (!gameRecordId) return;

  try {
    const report = await analyseGame(gameRecordId);
    await cacheAnalysisReport(report);
    console.log(`\n${renderTextReport(report)}\n`);
  } catch (error) {
    // A game that cannot be replayed is an expected skip, not a failure.
    if (error instanceof GameNotAnalysableError) {
      console.warn(`[anticheat] Skipped analysis for session ${gameSessionId}: ${error.message}`);
      return;
    }
    throw error;
  }
}

/**
 * Scores a suspect's recent history and returns the outcome.
 *
 * Rating is a caller-supplied input; null omits the accuracy-versus-rating
 * signal rather than substituting a rating.
 */
export async function reviewUserHistory(
  userId: string,
  situation: Situation,
  rating: number | null
): Promise<DetectionOutcome | null> {
  const window = await loadReviewWindow(userId, situation, rating);
  if (!window.isSufficient) return null;

  const windowPolicy = new PolicyRegistry().getReviewWindowPolicy(situation);
  const baselines = new StatisticalBaselines().getFor({
    rating,
    variantId: windowPolicy.variantIds[0],
    initialSeconds: windowPolicy.initialSeconds,
    incrementSeconds: windowPolicy.incrementSeconds,
  });

  return scoreReviewWindow(window, baselines, new PolicyRegistry());
}

/**
 * Reviews every participant of a finished game.
 *
 * Registered as the `whole_history_review` action. Runs no engine work — it
 * aggregates analysis cached when each game completed, so attaching it to
 * `post_game` costs milliseconds rather than the ~25s a recompute would.
 */
export async function runWholeHistoryReview(gameSessionId: string): Promise<void> {
  if (!env.ANTICHEAT_ENABLED) return;

  const gameRecordId = await resolveRecordId(gameSessionId);
  if (!gameRecordId) return;

  const participants = await prisma.gameParticipant.findMany({
    where: { gameRecordId },
    select: { userId: true },
  });

  for (const { userId } of participants) {
    // No player has a rating, so the accuracy signal stays absent for now.
    const outcome = await reviewUserHistory(userId, REPORT_SITUATION, null);
    if (!outcome) continue;
    console.log(`\n${renderReviewSummary(outcome)}\n`);
  }
}

/**
 * Assembles a suspect's review window from cached analysis.
 *
 * Runs no engine work by design: it reads only games already analysed, so a
 * review can never queue Stockfish behind a live game.
 *
 * `rating` is a caller-supplied input — no player has one yet, and the games in
 * the window are unrated.
 */
export async function loadReviewWindow(
  userId: string,
  situation: Situation,
  rating: number | null
): Promise<ReviewWindow> {
  const policy = new PolicyRegistry();
  const windowPolicy = policy.getReviewWindowPolicy(situation);

  return buildReviewWindow({
    userId,
    situation,
    rating,
    candidates: await findReviewCandidates(userId, windowPolicy),
    windowPolicy,
    scoredMovePolicy: policy.getScoredMovePolicy(situation),
  });
}

/**
 * Stores the engine output so multi-game review can aggregate this game later
 * without running the engine again.
 */
async function cacheAnalysisReport(report: GameAnalysisReport): Promise<void> {
  await saveGameAnalysis({
    gameRecordId: report.gameRecordId,
    engineName: ENGINE_NAME,
    engineDepth: report.depth,
    startingFen: report.startingFen,
    plies: buildPersistedPlies(report.analysedMoves),
  });
}

export { GameNotAnalysableError };
export type { GameAnalysisReport };
