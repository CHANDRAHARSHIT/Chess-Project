/**
 * Applies consequences for confirmed violations.
 *
 * PENALTIES DO NOT VARY BY SITUATION. If low-stakes cheating carried weaker
 * consequences, those games would become a safe place to learn evasion before
 * moving to games that matter. Detection *intensity* scales with risk; severity
 * does not.
 *
 * A detection is the only gate: if the checks crossed the threshold, the actions
 * for the user's escalation level apply. Severity comes from how many times they
 * have been caught, never from what kind of game it was.
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
import { prismaPenaltyRepository, type PenaltyRepository } from "./penaltyRepository.js";
import { prismaActionRepository, type ActionRepository } from "./actionRepository.js";

export class PenaltyManager {
  constructor(
    private readonly policy: PolicyRegistry,
    private readonly ladder: EscalationLadder,
    private readonly repository: PenaltyRepository = prismaPenaltyRepository,
    private readonly actions: ActionRepository = prismaActionRepository
  ) {}

  /** Empty unless detection fired — nothing else may produce a penalty. */
  async determineActions(
    outcome: DetectionOutcome,
    level: EscalationLevel
  ): Promise<readonly PenaltyAction[]> {
    if (!outcome.detected) return [];

    return this.ladder.actionsForLevel(level, outcome.situation);
  }

  /** caseId is mandatory — a penalty with no reviewable case behind it can't be appealed. */
  async apply(
    userId: string,
    action: PenaltyAction,
    caseId: string,
    situation: Situation,
    level: EscalationLevel
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
      level,
      situation,
      expiresAt: await this.calculateExpiry(action),
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

  /** Duration comes from the action catalogue, so a new action needs no code change. */
  private async calculateExpiry(action: PenaltyAction): Promise<Date | null> {
    const actionType = await this.actions.findActionByCode(action);
    if (!actionType) throw new UnknownPenaltyActionError(`Unknown penalty action '${action}'.`);

    return actionType.defaultDurationMs === null
      ? null
      : new Date(Date.now() + actionType.defaultDurationMs);
  }
}

export class UnappealablePenaltyError extends Error {}
export class UnknownPenaltyActionError extends Error {}
export class PenaltyNotFoundError extends Error {}
