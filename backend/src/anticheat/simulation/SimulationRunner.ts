/**
 * Runs the detector against scenarios whose answers are already known.
 *
 * The only mechanism by which any threshold in PolicyRegistry can be justified —
 * every number should trace back to a run here.
 *
 * The control group (cheatingLevel "none") is not optional: without clean runs
 * there's no false-positive measurement, and false positives are the failure
 * mode that actually costs users.
 */

import type { CheaterType, EventType, Situation } from "../types.js";
import type { CheatMethod, InjectionSpec } from "./CheatInjector.js";

export type CheatingLevel = "none" | "low" | "medium" | "high";

export interface SimulationScenario {
  readonly scenarioId: string;
  readonly eventType: EventType;
  readonly cheatingLevel: CheatingLevel;
  readonly cheaterType: CheaterType;
  readonly methods: readonly CheatMethod[];
  readonly injection: InjectionSpec;
  readonly ratingRange: { readonly min: number; readonly max: number };
  readonly participantCount: number;
  readonly gamesPerParticipant: number;
}

export interface SimulationRunConfig {
  readonly runId: string;
  readonly totalSimulations: number;
  /** Must include a `none` control group. */
  readonly distribution: Readonly<Record<CheatingLevel, number>>;
  readonly scenarios: readonly SimulationScenario[];
  readonly corpusId: string;
  readonly seed: number;
  /** So a result is attributable to a configuration. */
  readonly policyVersion: number;
}

export interface SimulationOutcome {
  readonly scenarioId: string;
  readonly userId: string;
  /** Ground truth. */
  readonly didCheat: boolean;
  readonly wasDetected: boolean;
  readonly gamesUntilDetection?: number;
  readonly finalCertainty: number;
}

export class SimulationRunner {
  buildRun(config: Partial<SimulationRunConfig>): SimulationRunConfig {
    throw new Error("Not implemented");
  }

  /**
   * Dominated by engine analysis, not the detector. Must be resumable — losing
   * six hours to a restart makes the tuning loop unusable.
   */
  run(config: SimulationRunConfig): Promise<readonly SimulationOutcome[]> {
    throw new Error("Not implemented");
  }

  runScenario(scenario: SimulationScenario, corpusId: string): Promise<readonly SimulationOutcome[]> {
    throw new Error("Not implemented");
  }

  recreateTournament(tournamentId: string, corpusId: string): Promise<string> {
    throw new Error("Not implemented");
  }

  /** Reproducibility is a hard requirement, not a convenience. */
  replay(runId: string): Promise<readonly SimulationOutcome[]> {
    throw new Error("Not implemented");
  }

  scenariosForSituation(situation: Situation): readonly SimulationScenario[] {
    throw new Error("Not implemented");
  }
}
