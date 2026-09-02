/**
 * Single owner of every tunable number in the ACS.
 *
 * Spec rule: no threshold, weight, or constant may live anywhere else in
 * `anticheat/` — a hardcoded number outside this class is a defect.
 * Every getter takes a Situation so situation-blind policy is impossible.
 *
 * Values are internal methodology. Never expose them on a public endpoint.
 */

import type {
  CheckId,
  EscalationLevel,
  PenaltyAction,
  Situation,
  TriggerPoint,
} from "../types.js";

export interface PolicyValue<T> {
  readonly value: T;
  readonly version: number;
  readonly updatedAt: Date;
  readonly updatedBy: string;
  /** Typically a simulation run id. */
  readonly rationale?: string;
}

export interface CheckWeighting {
  readonly checkId: CheckId;
  readonly weight: number;
  /** False retires the check for this Situation without a code change. */
  readonly enabled: boolean;
}

/** Centipawn-loss boundaries separating move qualities. */
export interface MoveQualityBands {
  /** Loss at or above this is a blunder. */
  readonly blunder: number;
  readonly mistake: number;
  readonly inaccuracy: number;
  /** Loss at or below this counts as a best move. */
  readonly best: number;
  /**
   * Ceiling applied to any single move's centipawn loss.
   *
   * Mate scores sit around ±10000, so one move that allows mate would otherwise
   * push an average centipawn loss into the thousands and make the statistic
   * meaningless. Clamping keeps the average comparable across games.
   */
  readonly maxLoss: number;
}

/**
 * Provisional bands, uniform across Situations until the Simulation module
 * produces real per-Situation figures. Roughly the conventional thresholds:
 * a blunder loses at least a piece's worth of evaluation.
 *
 * These live here rather than in BlunderAnalyzer precisely so that changing them
 * is a policy edit, not a code edit.
 */
const PROVISIONAL_QUALITY_BANDS: MoveQualityBands = {
  blunder: 300,
  mistake: 150,
  inaccuracy: 50,
  best: 10,
  maxLoss: 1000,
};

/** Roughly a clear extra piece — provisional, like the bands above. */
const DECISIVE_ADVANTAGE_CP = 300;

/** Which games a multi-game review runs over. */
export interface ReviewWindowPolicy {
  readonly gameCount: number;
  readonly maxAgeDays: number;
  /** Games shorter than this carry no statistical signal. */
  readonly minMovesPerGame: number;
  /** Below this the review reports insufficient evidence rather than a score. */
  readonly minAnalysableGames: number;
  readonly includeBotGames: boolean;
  /** Baselines are scoped per variant, so a window must not mix them. */
  readonly variantIds: readonly string[];
  readonly initialSeconds: number;
  readonly incrementSeconds: number;
}

/** Which plies carry information about who chose the move. */
export interface ScoredMovePolicy {
  readonly openingExcludedPlies: number;
  /** Above this the position is decided; win percentage saturates and every move scores near-perfect. */
  readonly decidedPositionCp: number;
  readonly minLegalMoves: number;
  /**
   * Best-versus-second-best gap marking a forced position. Null disables the
   * filter — it needs a second engine line, and the engine returns one.
   */
  readonly forcedGapCp: number | null;
}

/**
 * Placeholders. Only `gameCount` and `includeBotGames` are decisions rather
 * than guesses: ten games is the founder's figure, and bot games are excluded
 * because our bot plays random legal moves, which inflates every human's
 * accuracy to near-perfect. Everything else needs the Simulation module.
 */
const PROVISIONAL_REVIEW_WINDOW: ReviewWindowPolicy = {
  gameCount: 10,
  maxAgeDays: 90,
  minMovesPerGame: 20,
  minAnalysableGames: 5,
  includeBotGames: false,
  variantIds: ["chess960"],
  initialSeconds: 300,
  incrementSeconds: 3,
};

/**
 * `minLegalMoves` of 2 is the one principled value here: a position with a
 * single legal move says nothing about who chose it.
 */
const PROVISIONAL_SCORED_MOVES: ScoredMovePolicy = {
  openingExcludedPlies: 16,
  decidedPositionCp: DECISIVE_ADVANTAGE_CP,
  minLegalMoves: 2,
  forcedGapCp: null,
};

export class PolicyRegistry {
  /**
   * Centipawn-loss bands for move classification.
   *
   * The only implemented getter: post-game blunder review needs it. Everything
   * else still throws until the Simulation module can justify a number.
   */
  getMoveQualityBands(situation: Situation): MoveQualityBands {
    return PROVISIONAL_QUALITY_BANDS;
  }

  /**
   * Evaluation above which a position counts as decisively won, in centipawns.
   * Used to locate the point a game stopped being competitive.
   */
  getDecisiveAdvantageCp(situation: Situation): number {
    return DECISIVE_ADVANTAGE_CP;
  }

  getReviewWindowPolicy(situation: Situation): ReviewWindowPolicy {
    return PROVISIONAL_REVIEW_WINDOW;
  }

  getScoredMovePolicy(situation: Situation): ScoredMovePolicy {
    return PROVISIONAL_SCORED_MOVES;
  }

  /** Summed-DCS value above which detection is reported. Spec's `> 100` is a placeholder. */
  getDetectionThreshold(situation: Situation): number {
    throw new Error("Not implemented");
  }

  getCheckWeightings(situation: Situation): readonly CheckWeighting[] {
    throw new Error("Not implemented");
  }

  /** Where detection intensity scales with risk. Penalties must not scale this way. */
  getActiveTriggers(situation: Situation): readonly TriggerPoint[] {
    throw new Error("Not implemented");
  }

  /** Bar rises with the harm a wrong call causes: monitoring is cheap, a ban is not. */
  getCertaintyThreshold(action: PenaltyAction, situation: Situation): number {
    throw new Error("Not implemented");
  }

  /** Flags constituting a pattern rather than an anomaly. Spec's provisional figure is 3. */
  getPatternFlagThreshold(situation: Situation): number {
    throw new Error("Not implemented");
  }

  /** Rating at or below which a user is "average". */
  getProficiencyBoundary(): number {
    throw new Error("Not implemented");
  }

  getScrutinyDurationMs(level: EscalationLevel): number {
    throw new Error("Not implemented");
  }

  getEligibilityGameRequirement(situation: Situation): number {
    throw new Error("Not implemented");
  }

  /**
   * Append-only and versioned — reconstructing which policy version produced a
   * historical decision is what makes an appeal reviewable.
   */
  set<T>(key: string, situation: Situation, value: T, updatedBy: string, rationale?: string): void {
    throw new Error("Not implemented");
  }

  history<T>(key: string, situation: Situation): readonly PolicyValue<T>[] {
    throw new Error("Not implemented");
  }

  rollback(key: string, situation: Situation, toVersion: number, updatedBy: string): void {
    throw new Error("Not implemented");
  }
}
