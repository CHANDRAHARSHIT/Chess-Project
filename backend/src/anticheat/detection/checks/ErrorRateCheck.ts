/**
 * Accuracy and ACPL versus the expected range for the suspect's rating band.
 * Needs StatisticalBaselines populated — without it, supports() must return false.
 */

import { Check } from "../Check.js";
import type { AnalysisWindow, CheckId, CheckResult } from "../../types.js";
import type { PolicyRegistry } from "../../feedback/PolicyRegistry.js";
import type { StatisticalBaselines } from "../StatisticalBaselines.js";

export class ErrorRateCheck extends Check {
  readonly id: CheckId = "error_rate";
  readonly description = "Accuracy and ACPL versus the expected range for the rating band.";

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

  computeAccuracy(window: AnalysisWindow): number {
    throw new Error("Not implemented");
  }

  computeAverageCentipawnLoss(window: AnalysisWindow): number {
    throw new Error("Not implemented");
  }

  /** Score derives from this, not raw accuracy: 90% means very different things at 800 vs 2400. */
  deviationFromBaseline(window: AnalysisWindow, observedAccuracy: number): number {
    throw new Error("Not implemented");
  }
}
