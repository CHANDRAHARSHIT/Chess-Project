/**
 * Runs Checks and aggregates them: detected when Σ DCS > the Situation's threshold.
 *
 * Produces a DetectionOutcome and nothing else — no penalties, no notifications.
 * That purity is what lets SimulationRunner execute it thousands of times
 * against synthetic data with no side effects.
 *
 * Nothing here is user-facing. Published thresholds become circumvention targets.
 */

import type {
  AnalysisWindow,
  CheckResult,
  DetectionOutcome,
  Situation,
  TriggerPoint,
} from "../types.js";
import type { Check } from "./Check.js";
import type { PolicyRegistry } from "../feedback/PolicyRegistry.js";

export class DetectionEngine {
  private readonly checks: Check[] = [];

  constructor(private readonly policy: PolicyRegistry) {}

  /** Registration ≠ running. PolicyRegistry decides enablement and weight per Situation. */
  register(check: Check): void {
    throw new Error("Not implemented");
  }

  getChecks(): readonly Check[] {
    throw new Error("Not implemented");
  }

  /** Intersection of registration, policy enablement, and in-progress support. */
  resolveChecksFor(situation: Situation, trigger: TriggerPoint): readonly Check[] {
    throw new Error("Not implemented");
  }

  evaluate(window: AnalysisWindow, trigger: TriggerPoint): Promise<DetectionOutcome> {
    throw new Error("Not implemented");
  }

  /**
   * Mid-game path. Spec requires acting on sufficient evidence at move 10 rather
   * than making the opponent play on to move 40 already suspecting them.
   * Must be cheap enough to run per-ply without touching the game loop.
   */
  evaluateInProgress(window: AnalysisWindow): Promise<DetectionOutcome> {
    throw new Error("Not implemented");
  }

  applyWeightings(results: readonly CheckResult[], situation: Situation): readonly CheckResult[] {
    throw new Error("Not implemented");
  }

  /**
   * Score → calibrated probability. Must be modelled, not arbitrary: a "70%"
   * that isn't right 70% of the time makes every certainty bar in
   * PenaltyManager silently wrong.
   */
  calibrateCertainty(totalScore: number, situation: Situation): number {
    throw new Error("Not implemented");
  }
}
