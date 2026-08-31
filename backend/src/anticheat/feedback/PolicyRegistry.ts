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

export class PolicyRegistry {
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
