/**
 * What legitimate play looks like at each rating. Hard prerequisite for most checks.
 *
 * Source should be OTB games — the opportunity for assistance there differs
 * enough from anonymous online play to approximate a clean baseline.
 *
 * Self-poisoning hazard: baselines built from our own games would absorb
 * undetected cheating, raising expected values, raising thresholds, letting more
 * through. Any online-sourced baseline must exclude confirmed-violation games
 * and be recomputed rather than incrementally updated.
 */

import type { ProficiencyLevel } from "../types.js";

export interface RatingBand {
  readonly min: number;
  readonly max: number;
}

/** Std devs matter as much as means — checks score by deviation. */
export interface BaselineMetrics {
  readonly band: RatingBand;
  readonly expectedAccuracy: number;
  readonly accuracyStdDev: number;
  readonly expectedCentipawnLoss: number;
  readonly centipawnLossStdDev: number;
  readonly expectedBlunderRate: number;
  readonly expectedMistakeRate: number;
  readonly expectedEngineCorrelation: number;
  readonly engineCorrelationStdDev: number;
  /** Runs of engine-best moves are normal in strong play; a raw length is not evidence. */
  readonly expectedEngineStreak: number;
  readonly engineStreakStdDev: number;
  /**
   * Expected spread of accuracy across a player's games. The anomaly is an
   * abnormally low spread, so this is compared in the opposite direction.
   */
  readonly expectedAccuracySpread: number;
  readonly accuracySpreadStdDev: number;
  readonly expectedCriticalPositionAccuracy: number;
  readonly expectedOpeningAccuracy: number;
  readonly expectedEndgameAccuracy: number;
  readonly expectedMeanThinkTimeMs: number;
  readonly thinkTimeStdDevMs: number;
  readonly sampleSize: number;
  readonly computedAt: Date;
  /** For reproducing and auditing the figures. */
  readonly corpusId: string;
}

/**
 * What a baseline must be scoped to.
 *
 * Rating alone is not enough. Accuracy at 5+3 blitz sits far below accuracy at
 * classical for the same player, and Chess960 removes the opening theory that
 * lifts it further — so a figure borrowed from classical standard chess sets the
 * expected mean far too high and destroys the signal. See
 * ../MULTI_GAME_REVIEW_REQUIREMENTS.md §2.1, §2.2, §9.1.
 */
export interface BaselineContext {
  readonly rating: number;
  readonly variantId: string;
  readonly initialSeconds: number;
  readonly incrementSeconds: number;
}

export class StatisticalBaselines {
  getFor(context: BaselineContext): BaselineMetrics {
    throw new Error("Not implemented");
  }

  getForBand(band: RatingBand): BaselineMetrics {
    throw new Error("Not implemented");
  }

  /**
   * Checks must call this before scoring. Thin bands manufacture false positives
   * at the rating extremes, where sample counts are always lowest.
   */
  hasSufficientSample(context: BaselineContext): boolean {
    throw new Error("Not implemented");
  }

  /** Offline and long-running — means running an engine over the whole corpus. */
  recompute(corpusId: string): Promise<void> {
    throw new Error("Not implemented");
  }

  classifyProficiency(rating: number, gamesPlayed: number): ProficiencyLevel {
    throw new Error("Not implemented");
  }
}
