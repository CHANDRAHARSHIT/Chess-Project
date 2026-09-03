/**
 * Assembles the set of games a multi-game review runs over.
 *
 * Deliberately not `AnalysisWindow`: that type flattens every ply into one
 * list, and the pattern rules need per-game figures — a signal's window score
 * is the median across games, never the sum or the maximum. It also requires
 * `AnalyzedMove`, which carries a FEN and a think time that cached analysis
 * does not store. See ../MULTI_GAME_REVIEW_REQUIREMENTS.md §6.
 */

import type { PersistedPly, ReviewCandidate } from "../analysisRepository.js";
import type {
  ReviewWindowPolicy,
  ScoredMovePolicy,
} from "../feedback/PolicyRegistry.js";
import type { Situation } from "../types.js";
import { countExclusions, selectScoredPlies, type PlyExclusionReason } from "./ScoredMoves.js";

export type GameExclusionReason = "wrong_side" | "no_scored_moves";

export interface ExcludedGame {
  readonly gameRecordId: string;
  readonly reason: GameExclusionReason;
}

/** One game as the review sees it: the suspect's plies, and which of them count. */
export interface ReviewGame {
  readonly gameRecordId: string;
  readonly side: number;
  readonly endedAt: Date;
  readonly engineName: string;
  readonly engineDepth: number;
  readonly plies: readonly PersistedPly[];
  readonly scoredPlies: readonly PersistedPly[];
  readonly exclusions: Readonly<Record<PlyExclusionReason, number>>;
}

export interface ReviewWindow {
  readonly userId: string;
  readonly situation: Situation;
  /**
   * Supplied by the caller, never read from the database: no player has a
   * rating yet. Null means rating-dependent signals cannot run.
   */
  readonly rating: number | null;
  readonly games: readonly ReviewGame[];
  readonly excludedGames: readonly ExcludedGame[];
  /** False when too few games qualified for any score to be meaningful. */
  readonly isSufficient: boolean;
  /**
   * True when every game was analysed by the same engine at the same depth.
   * Mixing them would compare evaluations produced under different conditions.
   */
  readonly isEngineConsistent: boolean;
}

export interface ReviewWindowInput {
  readonly userId: string;
  readonly situation: Situation;
  readonly rating: number | null;
  readonly candidates: readonly ReviewCandidate[];
  readonly windowPolicy: ReviewWindowPolicy;
  readonly scoredMovePolicy: ScoredMovePolicy;
}

export function buildReviewWindow(input: ReviewWindowInput): ReviewWindow {
  const games: ReviewGame[] = [];
  const excludedGames: ExcludedGame[] = [];

  for (const candidate of input.candidates) {
    const game = buildReviewGame(candidate, input.scoredMovePolicy);

    if (game.plies.length === 0) {
      excludedGames.push({ gameRecordId: candidate.gameRecordId, reason: "wrong_side" });
      continue;
    }
    if (game.scoredPlies.length === 0) {
      excludedGames.push({ gameRecordId: candidate.gameRecordId, reason: "no_scored_moves" });
      continue;
    }
    games.push(game);
  }

  return {
    userId: input.userId,
    situation: input.situation,
    rating: input.rating,
    games,
    excludedGames,
    isSufficient: games.length >= input.windowPolicy.minAnalysableGames,
    isEngineConsistent: hasConsistentEngine(games),
  };
}

function buildReviewGame(
  candidate: ReviewCandidate,
  policy: ScoredMovePolicy
): ReviewGame {
  const ownPlies = candidate.plies.filter((ply) => ply.side === candidate.side);

  return {
    gameRecordId: candidate.gameRecordId,
    side: candidate.side,
    endedAt: candidate.endedAt,
    engineName: candidate.engineName,
    engineDepth: candidate.engineDepth,
    plies: ownPlies,
    scoredPlies: selectScoredPlies(ownPlies, policy),
    exclusions: countExclusions(ownPlies, policy),
  };
}

function hasConsistentEngine(games: readonly ReviewGame[]): boolean {
  if (games.length === 0) return true;
  const [first] = games;
  return games.every(
    (game) => game.engineName === first.engineName && game.engineDepth === first.engineDepth
  );
}
