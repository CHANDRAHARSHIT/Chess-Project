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
 *
 * `determineActions` is the automatic path and is gated by those bars. `apply` is
 * the arbiter's path and is not — a human who has read the case outranks them.
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
import {
  prismaPenaltyRepository,
  type PenaltyRepository,
} from "./penaltyRepository.js";

export class PenaltyManager {
  constructor(
    private readonly policy: PolicyRegistry,
    private readonly ladder: EscalationLadder,
    private readonly repository: PenaltyRepository = prismaPenaltyRepository
  ) {}

  canApply(action: PenaltyAction, certainty: number, situation: Situation): boolean {
    return certainty >= this.policy.getCertaintyThreshold(action, situation);
  }

  /** Empty is the correct and common result for a single flag. */
  async determineActions(
    outcome: DetectionOutcome,
    level: EscalationLevel
  ): Promise<readonly PenaltyAction[]> {
    if (!outcome.detected) return [];

    return this.ladder
      .actionsForLevel(level, outcome.situation)
      .filter((action) => this.canApply(action, outcome.certainty, outcome.situation));
  }

  /** caseId is mandatory — a penalty with no reviewable case behind it can't be appealed. */
  async apply(
    userId: string,
    action: PenaltyAction,
    caseId: string,
    situation: Situation
  ): Promise<AppliedPenalty> {
    if (!caseId.trim()) {
      throw new UnappealablePenaltyError(
        `Refusing to apply '${action}' to '${userId}' with no case behind it.`
      );
    }

    return this.repository.savePenalty({
      userId,
      caseId,
      action,
      level: await this.ladder.getLevel(userId, situation),
      situation,
      expiresAt: this.calculateExpiry(action, situation),
    });
  }

  /** Reversal alone is incomplete — the user may also be owed rating restoration. */
  async reverse(penaltyId: string, reason: string): Promise<AppliedPenalty> {
    const penalty = await this.repository.findPenaltyById(penaltyId);
    if (!penalty) throw new PenaltyNotFoundError(`Penalty '${penaltyId}' not found.`);
    if (penalty.reversed) return penalty;

    return this.repository.reversePenalty(penaltyId, reason);
  }

  getActivePenalties(userId: string): Promise<readonly AppliedPenalty[]> {
    return Promise.resolve(this.repository.findActivePenalties(userId));
  }

  getPenaltyHistory(userId: string): Promise<readonly AppliedPenalty[]> {
    return Promise.resolve(this.repository.findPenaltyHistory(userId));
  }

  private calculateExpiry(action: PenaltyAction, situation: Situation): Date | null {
    const durationMs = this.policy.getPenaltyDurationMs(action, situation);
    return durationMs === null ? null : new Date(Date.now() + durationMs);
  }
}

export class UnappealablePenaltyError extends Error {}
export class PenaltyNotFoundError extends Error {}
