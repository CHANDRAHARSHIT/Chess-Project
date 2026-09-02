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

const DAY_MS = 24 * 60 * 60 * 1000;

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
 * than guesses: ten games is a product decision, and bot games are excluded
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

/** Where one signal's per-game deviation turns into a score. */
export interface SignalThresholds {
  /** Standard deviations above the band mean at which a game flags. */
  readonly zFlag: number;
  /** Standard deviations at which the score saturates at 100. */
  readonly zCeiling: number;
  /** Below this the signal is unmeasured for that game — never scored as zero. */
  readonly minScoredMoves: number;
  readonly enabled: boolean;
  readonly weight: number;
}

/** What separates a pattern from one exceptional game. */
export interface PatternPolicy {
  /** Below this many flagged games, detection is false whatever the score. */
  readonly flaggedGameCount: number;
  readonly flaggedGameFraction: number;
  /** Games carrying two or more simultaneous flags before the multiplier applies. */
  readonly coOccurrenceGameCount: number;
  readonly coOccurrenceMultiplier: number;
  /** Ceiling on any single signal's contribution, so none alone crosses the threshold. */
  readonly singleSignalCap: number;
}

export interface CertaintyPolicy {
  /**
   * Ceiling applied while baselines are placeholders. Set below the lowest
   * certainty any penalty requires, so a review computed from guessed numbers
   * cannot trigger one — by construction, not by discipline.
   */
  readonly uncalibratedCeiling: number;
  /** False once real baselines replace the placeholders. */
  readonly placeholderMode: boolean;
}

/**
 * Placeholders. Engine correlation is deliberately the least sensitive of the
 * three: without a second engine line we cannot exclude forced positions, so its
 * measured rate is an upper bound and a low flag threshold would make it the
 * dominant false-positive source.
 */
const PROVISIONAL_SIGNAL_THRESHOLDS: Readonly<Record<string, SignalThresholds>> = {
  accuracy: { zFlag: 2, zCeiling: 4, minScoredMoves: 15, enabled: true, weight: 1 },
  engine_correlation: { zFlag: 3, zCeiling: 5, minScoredMoves: 15, enabled: true, weight: 1 },
  engine_streak: { zFlag: 2.5, zCeiling: 5, minScoredMoves: 15, enabled: true, weight: 1 },
  consistency: { zFlag: 2, zCeiling: 4, minScoredMoves: 0, enabled: true, weight: 1 },
};

/** `flaggedGameCount` is the spec's provisional three-red-flags figure. */
const PROVISIONAL_PATTERN_POLICY: PatternPolicy = {
  flaggedGameCount: 3,
  flaggedGameFraction: 0.3,
  coOccurrenceGameCount: 2,
  coOccurrenceMultiplier: 1.5,
  singleSignalCap: 90,
};

const PROVISIONAL_DETECTION_THRESHOLD = 100;

/**
 * The ceiling sits below `increase_monitoring`, the cheapest action in the
 * ladder, so no placeholder-driven review reaches any consequence at all.
 */
const PROVISIONAL_CERTAINTY_POLICY: CertaintyPolicy = {
  uncalibratedCeiling: 0.2,
  placeholderMode: true,
};

const AUTOMATIC_CASE_OPENING_ENABLED = true;

/**
 * Certainty each action requires on the automatic path. Provisional, but every
 * value must stay above `uncalibratedCeiling` — that is what stops a
 * placeholder-driven review reaching any consequence.
 */
const PROVISIONAL_CERTAINTY_THRESHOLDS: Readonly<Record<PenaltyAction, number>> = {
  increase_monitoring: 0.3,
  warning: 0.4,
  strike: 0.55,
  restrict_from_prize_events: 0.65,
  restrict_from_rated_events: 0.7,
  suspend_from_current_event: 0.75,
  temporary_ban: 0.85,
  permanent_ban: 0.95,
};

/** The spec's ladder as data — new actions are entries here, never branches. */
const PROVISIONAL_LEVEL_ACTIONS: Readonly<Record<EscalationLevel, readonly PenaltyAction[]>> = {
  0: ["increase_monitoring"],
  1: ["increase_monitoring", "warning"],
  2: [
    "strike",
    "restrict_from_rated_events",
    "restrict_from_prize_events",
    "suspend_from_current_event",
    "temporary_ban",
  ],
  3: ["permanent_ban"],
};

/** Upheld cases at which each level begins, indexed level 1, 2, 3. */
const PROVISIONAL_UPHELD_CASES_PER_LEVEL: readonly number[] = [1, 2, 3];

/** How long a time-limited action lasts. Null never expires. */
const PROVISIONAL_PENALTY_DURATIONS_MS: Readonly<Record<PenaltyAction, number | null>> = {
  increase_monitoring: 30 * DAY_MS,
  warning: null,
  strike: null,
  restrict_from_prize_events: 90 * DAY_MS,
  restrict_from_rated_events: 90 * DAY_MS,
  suspend_from_current_event: null,
  temporary_ban: 30 * DAY_MS,
  permanent_ban: null,
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

  /** Undefined for an unknown signal id, so a typo cannot silently score zero. */
  getSignalThresholds(signalId: CheckId, situation: Situation): SignalThresholds | undefined {
    return PROVISIONAL_SIGNAL_THRESHOLDS[signalId];
  }

  getPatternPolicy(situation: Situation): PatternPolicy {
    return PROVISIONAL_PATTERN_POLICY;
  }

  getCertaintyPolicy(situation: Situation): CertaintyPolicy {
    return PROVISIONAL_CERTAINTY_POLICY;
  }

  /**
   * Safe to leave on: opening a case is not a consequence. The cost is queue
   * noise until real baselines land.
   */
  isAutomaticCaseOpeningEnabled(situation: Situation): boolean {
    return AUTOMATIC_CASE_OPENING_ENABLED;
  }

  /** Summed-DCS value above which detection is reported. Spec's `> 100` is a placeholder. */
  getDetectionThreshold(situation: Situation): number {
    return PROVISIONAL_DETECTION_THRESHOLD;
  }

  getCheckWeightings(situation: Situation): readonly CheckWeighting[] {
    throw new Error("Not implemented");
  }

  /** Where detection intensity scales with risk. Penalties must not scale this way. */
  getActiveTriggers(situation: Situation): readonly TriggerPoint[] {
    throw new Error("Not implemented");
  }

  /**
   * Situation-scoped by signature but uniform in value: raising a bar for a
   * high-risk Situation would be legitimate, softening one never is.
   */
  getCertaintyThreshold(action: PenaltyAction, situation: Situation): number {
    return PROVISIONAL_CERTAINTY_THRESHOLDS[action];
  }

  /** The ladder as data — new actions are entries, not code. */
  getActionsForLevel(level: EscalationLevel, situation: Situation): readonly PenaltyAction[] {
    return PROVISIONAL_LEVEL_ACTIONS[level];
  }

  /** Upheld-case counts at which levels 1, 2 and 3 begin. */
  getUpheldCasesPerLevel(situation: Situation): readonly number[] {
    return PROVISIONAL_UPHELD_CASES_PER_LEVEL;
  }

  /** How long an action lasts, or null when it never expires. */
  getPenaltyDurationMs(action: PenaltyAction, situation: Situation): number | null {
    return PROVISIONAL_PENALTY_DURATIONS_MS[action];
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
