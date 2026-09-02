/**
 * Levelled scrutiny, derived from the count of upheld cases and never stored —
 * an overturned case lowers the level by the same arithmetic that raised it.
 */

import type { EscalationLevel, PenaltyAction, Situation } from "../types.js";
import type { PolicyRegistry } from "../feedback/PolicyRegistry.js";
import type { CaseManager } from "../review/CaseManager.js";

export class EscalationLadder {
  constructor(
    private readonly policy: PolicyRegistry,
    private readonly cases: CaseManager
  ) {}

  async getLevel(userId: string, situation: Situation): Promise<EscalationLevel> {
    const upheldCases = await this.cases.countUpheldCases(userId);
    return this.calculateLevel(upheldCases, situation);
  }

  calculateLevel(upheldCases: number, situation: Situation): EscalationLevel {
    const boundaries = this.policy.getUpheldCasesPerLevel(situation);
    const level = boundaries.filter((required) => upheldCases >= required).length;
    return Math.min(level, 3) as EscalationLevel;
  }

  /** Drives detection intensity, not severity. */
  async isUnderHeightenedScrutiny(userId: string, situation: Situation): Promise<boolean> {
    return (await this.getLevel(userId, situation)) > 0;
  }

  actionsForLevel(level: EscalationLevel, situation: Situation): readonly PenaltyAction[] {
    return this.policy.getActionsForLevel(level, situation);
  }
}
