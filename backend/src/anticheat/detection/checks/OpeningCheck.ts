/**
 * Repertoire deviation and theory depth versus the user's history.
 *
 * Weighted low on its own — "I learned a new opening" is both a common
 * legitimate event and a perfect cover story. Meaningful only alongside other flags.
 */

import { Check } from "../Check.js";
import type { AnalysisWindow, CheckId, CheckResult } from "../../types.js";
import type { PolicyRegistry } from "../../feedback/PolicyRegistry.js";

export class OpeningCheck extends Check {
  readonly id: CheckId = "opening";
  readonly description = "Repertoire deviation and theory depth versus the user's history.";

  constructor(policy: PolicyRegistry) {
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

  historicalRepertoire(userId: string): Promise<Readonly<Record<string, number>>> {
    throw new Error("Not implemented");
  }

  theoryDepthPlies(window: AnalysisWindow): number {
    throw new Error("Not implemented");
  }

  /** Separate from scoring so a reviewer sees the raw fact independently of its weight. */
  isRepertoireDeviation(window: AnalysisWindow): Promise<boolean> {
    throw new Error("Not implemented");
  }
}
