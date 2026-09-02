/**
 * Injects known cheating into clean OTB games to produce ground truth.
 *
 * The hard part is translation, not injection. "User can see the eval bar" is
 * useless until turned into the concrete move change it produces: the bar tells
 * them when the opponent blundered, so the injection replaces a missed winning
 * reply with the move they missed.
 *
 * The spec's first version truncates the game after the injected move (opponent
 * resigns) so the detector faces one controlled change. That's a major untested
 * assumption — see validateTerminationAssumption.
 */

import type { CheaterType } from "../types.js";

export interface CheatMethod {
  readonly methodId: string;
  readonly name: string;
  /** What the user learns that they otherwise wouldn't. */
  readonly advantage: string;
  /** How that advantage changes the moves played. This is the translation. */
  readonly moveEffect: string;
  readonly associatedType: CheaterType;
}

export interface InjectionSpec {
  readonly method: CheatMethod;
  /** Fraction of the target's games to inject into, 0–1. */
  readonly gameFrequency: number;
  readonly movesPerGame: number;
  readonly terminateAfterInjection: boolean;
  /** Fixed, so a run reproduces exactly. */
  readonly seed: number;
}

/** Ground truth the detector is graded against. */
export interface InjectedGame {
  readonly originalGameId: string;
  readonly modifiedPgn: string;
  readonly cheatingUserId: string;
  readonly injectedPlies: readonly number[];
  readonly method: CheatMethod;
  readonly terminatedEarly: boolean;
}

export class CheatInjector {
  getMethodCatalogue(): readonly CheatMethod[] {
    throw new Error("Not implemented");
  }

  /** Runtime-extensible so a chess expert can expand the list without a code change. */
  registerMethod(method: CheatMethod): void {
    throw new Error("Not implemented");
  }

  inject(pgn: string, userId: string, spec: InjectionSpec): Promise<InjectedGame> {
    throw new Error("Not implemented");
  }

  /** Positions where the player missed a strong continuation after an opponent mistake. */
  findMissedOpportunities(pgn: string, userId: string): Promise<readonly number[]> {
    throw new Error("Not implemented");
  }

  /** Spec suggests first-opportunity initially, with random selection as a variation to test. */
  selectInjectionPoint(opportunities: readonly number[], seed: number): number {
    throw new Error("Not implemented");
  }

  terminateAfterMove(pgn: string, ply: number): string {
    throw new Error("Not implemented");
  }

  /** Until this passes, results from truncated simulations are provisional. */
  validateTerminationAssumption(sampleGameIds: readonly string[]): Promise<boolean> {
    throw new Error("Not implemented");
  }
}
