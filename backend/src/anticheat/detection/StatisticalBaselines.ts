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

export class StatisticalBaselines {
  getForRating(rating: number): BaselineMetrics {
    throw new Error("Not implemented");
  }

  getForBand(band: RatingBand): BaselineMetrics {
    throw new Error("Not implemented");
  }

  /**
   * Checks must call this before scoring. Thin bands manufacture false positives
   * at the rating extremes, where sample counts are always lowest.
   */
  hasSufficientSample(rating: number): boolean {
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
