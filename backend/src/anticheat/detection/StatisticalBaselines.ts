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
  /** Null selects the rating-agnostic population baseline — no player has a rating yet. */
  readonly rating: number | null;
  readonly variantId: string;
  readonly initialSeconds: number;
  readonly incrementSeconds: number;
}

/**
 * Rough rapid-chess estimates supplied as product direction. Accuracy is the
 * midpoint of the given range; blunder rate is the midpoint per move.
 *
 * These are for **rapid**, and every game here is 5+3 blitz, so the means are
 * too high. That errs toward missing cheating rather than accusing anyone, which
 * is the right direction to be wrong in, but it is still wrong.
 */
interface BaselineRow {
  readonly min: number;
  readonly max: number;
  readonly accuracyRange: readonly [number, number];
  readonly blundersPer100Range: readonly [number, number];
}

const RAPID_BASELINE_TABLE: readonly BaselineRow[] = [
  { min: 0, max: 799, accuracyRange: [55, 65], blundersPer100Range: [12, 15] },
  { min: 800, max: 999, accuracyRange: [60, 68], blundersPer100Range: [10, 12] },
  { min: 1000, max: 1199, accuracyRange: [65, 72], blundersPer100Range: [9, 10] },
  { min: 1200, max: 1399, accuracyRange: [68, 75], blundersPer100Range: [8, 9] },
  { min: 1400, max: 1599, accuracyRange: [72, 78], blundersPer100Range: [7, 8] },
  { min: 1600, max: 1799, accuracyRange: [75, 81], blundersPer100Range: [6, 7] },
  { min: 1800, max: 1999, accuracyRange: [78, 84], blundersPer100Range: [5, 6] },
  { min: 2000, max: 2199, accuracyRange: [81, 87], blundersPer100Range: [4, 5] },
  { min: 2200, max: 2399, accuracyRange: [84, 90], blundersPer100Range: [3, 4] },
  { min: 2400, max: Number.MAX_SAFE_INTEGER, accuracyRange: [87, 93], blundersPer100Range: [2, 3] },
];

/**
 * Invented, and deliberately wide.
 *
 * The supplied ranges describe where the expected *mean* sits, not how much a
 * single game varies around it. Taking σ from a range width would put an
 * ordinary good game three deviations out and flag it. Per-game accuracy varies
 * far more than the mean does, so this stays a placeholder — and it is the most
 * important number for the baseline task to replace.
 */
const PLACEHOLDER_ACCURACY_STD_DEV = 9;

/**
 * No figures exist for these. They scale across bands on a stated assumption
 * rather than data: a rating-invariant constant would systematically flag strong
 * players, whose agreement with the engine is legitimately higher.
 */
const PLACEHOLDER_CORRELATION_RANGE = [0.25, 0.55] as const;
const PLACEHOLDER_STREAK_RANGE = [3, 5] as const;
const PLACEHOLDER_CORRELATION_STD_DEV = 0.12;
const PLACEHOLDER_STREAK_STD_DEV = 1.5;
const PLACEHOLDER_ACCURACY_SPREAD = 12;
const PLACEHOLDER_ACCURACY_SPREAD_STD_DEV = 4;

const PLACEHOLDER_CORPUS_ID = "rough-rapid-estimates";

function midpoint([low, high]: readonly [number, number]): number {
  return (low + high) / 2;
}

export class StatisticalBaselines {
  /**
   * Ignores variant and time control for now: the only figures we have are
   * rapid standard chess, and there is nothing to select between. The context
   * is still required so callers are shaped for real, scoped baselines.
   */
  getFor(context: BaselineContext): BaselineMetrics {
    const rowIndex = this.findRowIndex(context.rating);
    return this.buildMetrics(RAPID_BASELINE_TABLE[rowIndex], rowIndex);
  }

  /**
   * With no rating there is no band to select, so the middle row stands in as a
   * population baseline. It is a weaker comparison than a banded one — which is
   * the honest consequence of having no ratings, not a defect to design around.
   */
  private findRowIndex(rating: number | null): number {
    if (rating === null) return Math.floor(RAPID_BASELINE_TABLE.length / 2);

    const index = RAPID_BASELINE_TABLE.findIndex(
      (row) => rating >= row.min && rating <= row.max
    );
    return Math.max(0, index);
  }

  getForBand(band: RatingBand): BaselineMetrics {
    return this.getFor({
      rating: band.min,
      variantId: "chess960",
      initialSeconds: 0,
      incrementSeconds: 0,
    });
  }

  /**
   * False everywhere: nothing here is measured. Scoring still runs, because the
   * certainty cap is what keeps a placeholder-driven review harmless — but no
   * caller may treat these figures as observed data.
   */
  hasSufficientSample(context: BaselineContext): boolean {
    return false;
  }

  private buildMetrics(row: BaselineRow, rowIndex: number): BaselineMetrics {
    // Position within the table, so the unmeasured signals rise with rating.
    const bandProgress = rowIndex / (RAPID_BASELINE_TABLE.length - 1);
    const scale = ([low, high]: readonly [number, number]) => low + (high - low) * bandProgress;
    const expectedAccuracy = midpoint(row.accuracyRange);

    return {
      band: { min: row.min, max: row.max },
      expectedAccuracy,
      accuracyStdDev: PLACEHOLDER_ACCURACY_STD_DEV,
      expectedCentipawnLoss: 0,
      centipawnLossStdDev: 0,
      expectedBlunderRate: midpoint(row.blundersPer100Range) / 100,
      expectedMistakeRate: 0,
      expectedEngineCorrelation: scale(PLACEHOLDER_CORRELATION_RANGE),
      engineCorrelationStdDev: PLACEHOLDER_CORRELATION_STD_DEV,
      expectedEngineStreak: scale(PLACEHOLDER_STREAK_RANGE),
      engineStreakStdDev: PLACEHOLDER_STREAK_STD_DEV,
      expectedAccuracySpread: PLACEHOLDER_ACCURACY_SPREAD,
      accuracySpreadStdDev: PLACEHOLDER_ACCURACY_SPREAD_STD_DEV,
      expectedCriticalPositionAccuracy: expectedAccuracy,
      expectedOpeningAccuracy: expectedAccuracy,
      expectedEndgameAccuracy: expectedAccuracy,
      expectedMeanThinkTimeMs: 0,
      thinkTimeStdDevMs: 0,
      // Zero is load-bearing: no game was ever measured to produce these.
      sampleSize: 0,
      computedAt: new Date(0),
      corpusId: PLACEHOLDER_CORPUS_ID,
    };
  }

  /** Offline and long-running — means running an engine over the whole corpus. */
  recompute(corpusId: string): Promise<void> {
    throw new Error("Not implemented");
  }

  classifyProficiency(rating: number, gamesPlayed: number): ProficiencyLevel {
    throw new Error("Not implemented");
  }
}
