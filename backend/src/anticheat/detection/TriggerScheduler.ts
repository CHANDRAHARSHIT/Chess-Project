/**
 * Decides when detection runs and assembles what it runs on.
 *
 * Detection intensity scales with risk here (via PolicyRegistry.getActiveTriggers),
 * keeping DetectionEngine a pure evaluator.
 *
 * Strictly observational: a slow or failing ACS must never delay a move, alter a
 * clock, or change a result.
 */

import type { AnalysisWindow, Situation, TriggerPoint } from "../types.js";

export interface TriggerContext {
  readonly trigger: TriggerPoint;
  readonly userId: string;
  readonly situation: Situation;
  readonly gameRecordIds: readonly string[];
  readonly gameSessionId?: string;
  readonly tournamentId?: string;
}

export class TriggerScheduler {
  shouldRun(trigger: TriggerPoint, situation: Situation): boolean {
    throw new Error("Not implemented");
  }

  /**
   * Must fail, not degrade, when per-ply timing is missing — a window without
   * thinkTimeMs silently disables every timing check.
   */
  buildWindow(context: TriggerContext): Promise<AnalysisWindow> {
    throw new Error("Not implemented");
  }

  /** Returns immediately; never blocks the caller. */
  schedule(context: TriggerContext): void {
    throw new Error("Not implemented");
  }

  /** Called by Session per ply. Must not throw into the game loop. */
  onMovePlayed(gameSessionId: string, userId: string, ply: number): void {
    throw new Error("Not implemented");
  }

  onGameCompleted(gameRecordId: string): void {
    throw new Error("Not implemented");
  }

  onTournamentRoundCompleted(tournamentId: string, round: number): void {
    throw new Error("Not implemented");
  }
}
