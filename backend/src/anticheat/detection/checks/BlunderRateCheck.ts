/**
 * Mistake/blunder frequency and distribution.
 *
 * Not redundant with ErrorRateCheck: a cheater tuning accuracy down to evade an
 * accuracy threshold still leaves an unnatural error *shape* — clean in hard
 * positions, sloppy in trivial ones.
 */

import { Check } from "../Check.js";
import type { AnalysisWindow, CheckId, CheckResult } from "../../types.js";
import type { PolicyRegistry } from "../../feedback/PolicyRegistry.js";
import type { StatisticalBaselines } from "../StatisticalBaselines.js";

export class BlunderRateCheck extends Check {
  readonly id: CheckId = "blunder_rate";
  readonly description = "Blunder/mistake frequency and distribution versus the rating band.";

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

  classifyErrors(window: AnalysisWindow): Readonly<Record<string, number>> {
    throw new Error("Not implemented");
  }

  /** A legitimate player errs *more* in critical positions. An inverted ratio is the Type 2 signal. */
  criticalVersusQuietErrorRatio(window: AnalysisWindow): number {
    throw new Error("Not implemented");
  }

  /** Errors large enough to depress an average but played where they cost nothing. */
  detectDeliberateErrors(window: AnalysisWindow): readonly number[] {
    throw new Error("Not implemented");
  }
}
