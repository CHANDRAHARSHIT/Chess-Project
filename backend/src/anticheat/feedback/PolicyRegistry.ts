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
