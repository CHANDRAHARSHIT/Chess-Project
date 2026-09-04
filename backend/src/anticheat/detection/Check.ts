/**
 * Base for all detection checks. A Check scores one AnalysisWindow 1–100 (DCS)
 * and does nothing else — no flags, no penalties, no calls to other modules.
 *
 * Subclass rules:
 *  - Read every threshold from PolicyRegistry, scoped to the Situation.
 *  - Return false from supports() rather than scoring thin data. A noisy score
 *    here becomes a false positive several layers up.
 *  - Populate evidence. An unexplained score can't survive an appeal.
 */

import type { AnalysisWindow, CheckId, CheckResult } from "../types.js";
import type { PolicyRegistry } from "../feedback/PolicyRegistry.js";

export abstract class Check {
  abstract readonly id: CheckId;
  abstract readonly description: string;

  constructor(protected readonly policy: PolicyRegistry) {}

  /** False excludes the check from the run entirely, contributing no score. */
  abstract supports(window: AnalysisWindow): boolean;

  abstract getScore(window: AnalysisWindow): Promise<CheckResult>;

  /** False for checks needing a completed game. */
  abstract get supportsInProgress(): boolean;
}
