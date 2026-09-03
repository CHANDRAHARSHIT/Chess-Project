/**
 * Applies consequences for confirmed violations.
 *
 * PENALTIES DO NOT VARY BY SITUATION. If low-stakes cheating carried weaker
 * consequences, those games would become a safe place to learn evasion before
 * moving to games that matter. Detection *intensity* scales with risk; severity
 * does not. Situation appears here only because certainty bars are
 * situation-scoped — it must never soften an outcome.
 *
 * Certainty is an expected-harm decision, not a single bar: letting a suspected
 * cheater finish a tournament while confidence climbs 60%→90% costs every honest
 * opponent they meet. Acting early costs an innocent player. Each action has its
 * own threshold.
 */

import type {
  AppliedPenalty,
  DetectionOutcome,
  EscalationLevel,
  PenaltyAction,
  Situation,
} from "../types.js";
import type { EscalationLadder } from "./EscalationLadder.js";
import type { PolicyRegistry } from "../feedback/PolicyRegistry.js";

export class PenaltyManager {
  constructor(
    private readonly policy: PolicyRegistry,
    private readonly ladder: EscalationLadder
  ) {}

  canApply(action: PenaltyAction, certainty: number, situation: Situation): boolean {
    throw new Error("Not implemented");
  }

  /** Empty is the correct and common result for a single flag. */
  determineActions(
    outcome: DetectionOutcome,
    level: EscalationLevel
  ): Promise<readonly PenaltyAction[]> {
    throw new Error("Not implemented");
  }

  /** caseId is mandatory — a penalty with no reviewable case behind it can't be appealed. */
  apply(
    userId: string,
    action: PenaltyAction,
    caseId: string,
    situation: Situation
  ): Promise<AppliedPenalty> {
    throw new Error("Not implemented");
  }

  /** Reversal alone is incomplete — the user may also be owed rating restoration. */
  reverse(penaltyId: string, reason: string): Promise<AppliedPenalty> {
    throw new Error("Not implemented");
  }

  getActivePenalties(userId: string): Promise<readonly AppliedPenalty[]> {
    throw new Error("Not implemented");
  }

  getPenaltyHistory(userId: string): Promise<readonly AppliedPenalty[]> {
    throw new Error("Not implemented");
  }

  expirePenalties(): Promise<number> {
    throw new Error("Not implemented");
  }
}
