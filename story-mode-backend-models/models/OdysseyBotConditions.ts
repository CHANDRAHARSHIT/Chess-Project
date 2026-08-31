import { EBotCondition } from "../enums/EBotCondition.js";

export const BOT_CONDITION_THRESHOLD = 100;

/**
 * Mirrors the reference project's PlayerStats/StatList pattern: a small
 * dictionary-backed stat holder with its own get/increase/reset behavior,
 * owned by whichever entity has these stats (here, OdysseyBattle) instead
 * of three loose confused/relaxed/distracted fields with inline >=100
 * checks scattered wherever they're read.
 */
export class OdysseyBotConditions {
  private values: Record<EBotCondition, number>;

  constructor() {
    throw new Error("Not implemented"); // all three start at 0
  }

  get(condition: EBotCondition): number {
    throw new Error("Not implemented");
  }

  /** Adds `amount`, clamped to [0, 100]. */
  increase(condition: EBotCondition, amount: number): void {
    throw new Error("Not implemented");
  }

  /** condition value >= BOT_CONDITION_THRESHOLD. */
  isActive(condition: EBotCondition): boolean {
    throw new Error("Not implemented");
  }

  /** Resets `condition` to 0 — called once it's been consumed for a bot move, regardless of whether it fired. */
  consume(condition: EBotCondition): void {
    throw new Error("Not implemented");
  }
}
