/**
 * Wraps PlayingPersonalityService as a scored Check.
 *
 * Must be weighted low enough that it cannot alone push the summed DCS past the
 * threshold — the spec forbids style deviation from indicating cheating by itself.
 */

import { Check } from "../Check.js";
import type { AnalysisWindow, CheckId, CheckResult } from "../../types.js";
import type { PolicyRegistry } from "../../feedback/PolicyRegistry.js";
import type { PlayingPersonalityService } from "../PlayingPersonality.js";

export class PlayingPersonalityCheck extends Check {
  readonly id: CheckId = "playing_personality";
  readonly description = "Divergence of current-game style from the user's historical profile.";

  constructor(
    policy: PolicyRegistry,
    private readonly personality: PlayingPersonalityService
  ) {
    super(policy);
  }

  get supportsInProgress(): boolean {
    throw new Error("Not implemented");
  }

  /** False when the historical profile is too thin to compare against. */
  supports(window: AnalysisWindow): boolean {
    throw new Error("Not implemented");
  }

  getScore(window: AnalysisWindow): Promise<CheckResult> {
    throw new Error("Not implemented");
  }
}
