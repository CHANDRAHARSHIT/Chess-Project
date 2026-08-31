/**
 * Think-time behaviour: flat timing, inverted difficulty correlation, consultation latency.
 *
 * Requires server-authoritative per-ply timing (AnalyzedMove.thinkTimeMs) — not
 * yet recorded anywhere. One of the few signals that survives a Type 3 cheater,
 * who can shape move choices far more easily than their clock.
 */

import { Check } from "../Check.js";
import type { AnalysisWindow, CheckId, CheckResult } from "../../types.js";
import type { PolicyRegistry } from "../../feedback/PolicyRegistry.js";
import type { StatisticalBaselines } from "../StatisticalBaselines.js";

export class MoveTimeCheck extends Check {
  readonly id: CheckId = "move_time";
  readonly description = "Think-time distribution and its correlation with position difficulty.";

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

  /** Low variance is the flat-timing signal. */
  thinkTimeVariance(window: AnalysisWindow): number {
    throw new Error("Not implemented");
  }

  /** Strongly positive for a human. Near zero or negative is the signal. */
  difficultyTimeCorrelation(window: AnalysisWindow): number {
    throw new Error("Not implemented");
  }

  detectTimingAnomalies(window: AnalysisWindow): readonly number[] {
    throw new Error("Not implemented");
  }
}
