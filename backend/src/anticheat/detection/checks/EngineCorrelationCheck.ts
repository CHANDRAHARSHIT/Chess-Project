/**
 * Rate of agreement with engine top choices. The defining Type 1 signal.
 *
 * Bluntest check in the system and the easiest to evade — never rely on it alone.
 * Spec's ship gate: if this can't catch Type 1 at a very low false-positive rate,
 * the detector isn't ready.
 */

import { Check } from "../Check.js";
import type { AnalysisWindow, CheckId, CheckResult } from "../../types.js";
import type { PolicyRegistry } from "../../feedback/PolicyRegistry.js";
import type { StatisticalBaselines } from "../StatisticalBaselines.js";

export class EngineCorrelationCheck extends Check {
  readonly id: CheckId = "engine_correlation";
  readonly description = "Rate of agreement with engine top choices, excluding forced positions.";

  constructor(
    policy: PolicyRegistry,
    private readonly baselines: StatisticalBaselines
  ) {
    super(policy);
  }

  get supportsInProgress(): boolean {
    throw new Error("Not implemented");
  }

  supports(window: AnalysisWindow): boolean {
    throw new Error("Not implemented");
  }

  getScore(window: AnalysisWindow): Promise<CheckResult> {
    throw new Error("Not implemented");
  }

  topMoveMatchRate(window: AnalysisWindow): number {
    throw new Error("Not implemented");
  }

  topNMatchRate(window: AnalysisWindow, n: number): number {
    throw new Error("Not implemented");
  }

  /** Skipping this is the check's largest false-positive source — forced moves carry no information. */
  excludeForcedPositions(window: AnalysisWindow): readonly number[] {
    throw new Error("Not implemented");
  }

  /** Weightier than the aggregate: one assisted stretch can hide inside an unremarkable average. */
  longestEngineMatchStreak(window: AnalysisWindow): number {
    throw new Error("Not implemented");
  }
}
