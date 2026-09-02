/**
 * Scores the detector against known ground truth. These numbers decide whether a
 * policy change ships.
 *
 * False-positive rate matters most — a banned innocent player is worse than a
 * missed cheater and is the one users tell each other about.
 */

import type { CheaterType, Situation } from "../types.js";
import type { CheatingLevel, SimulationOutcome } from "./SimulationRunner.js";

export interface MetricsReport {
  readonly runId: string;
  readonly sampleSize: number;

  readonly detectionRate: number;
  readonly falsePositiveRate: number;
  readonly falseNegativeRate: number;
  /** Of those flagged, the fraction who actually cheated. */
  readonly precision: number;
  /** Of those who cheated, the fraction detected. */
  readonly recall: number;
  readonly specificity: number;

  readonly meanGamesUntilDetection: number;
  readonly meanDetectionLatencyMs: number;

  /**
   * Gap between stated confidence and observed correctness. Good precision with
   * bad calibration silently invalidates every certainty bar in PenaltyManager.
   */
  readonly calibrationError: number;

  readonly computedAt: Date;
}

export interface CheckEffectiveness {
  readonly checkId: string;
  readonly standaloneDetectionRate: number;
  readonly standaloneFalsePositiveRate: number;
  /** Near zero means the check is redundant and its weight buys nothing. */
  readonly marginalContribution: number;
}

export class DetectionMetrics {
  compute(runId: string, outcomes: readonly SimulationOutcome[]): MetricsReport {
    throw new Error("Not implemented");
  }

  /** Type 1 is a hard gate: if obvious cheaters aren't caught cleanly, aggregate numbers don't matter. */
  computeByCheaterType(
    outcomes: readonly SimulationOutcome[]
  ): Readonly<Record<CheaterType, MetricsReport>> {
    throw new Error("Not implemented");
  }

  computeByCheatingLevel(
    outcomes: readonly SimulationOutcome[]
  ): Readonly<Record<CheatingLevel, MetricsReport>> {
    throw new Error("Not implemented");
  }

  computeBySituation(outcomes: readonly SimulationOutcome[]): ReadonlyMap<string, MetricsReport> {
    throw new Error("Not implemented");
  }

  computeCheckEffectiveness(runId: string): Promise<readonly CheckEffectiveness[]> {
    throw new Error("Not implemented");
  }

  /** Run before any policy change ships, and periodically to catch slow degradation. */
  compareRuns(baselineRunId: string, candidateRunId: string): Promise<Readonly<Record<string, number>>> {
    throw new Error("Not implemented");
  }

  meetsAcceptanceCriteria(report: MetricsReport, situation: Situation): boolean {
    throw new Error("Not implemented");
  }
}
