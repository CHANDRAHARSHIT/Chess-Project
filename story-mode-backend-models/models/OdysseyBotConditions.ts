import { EBotCondition } from "../enums/EBotCondition.js";

export const BOT_CONDITION_THRESHOLD = 100;
const MIN_VALUE = 0;
const MAX_VALUE = 100;

/**
 * A small dictionary-backed stat holder with its own get/increase/reset
 * behavior, owned by whichever entity has these stats (here,
 * OdysseyBattle) instead of three loose confused/relaxed/distracted
 * fields with inline >=100 checks scattered wherever they're read.
 */
export class OdysseyBotConditions {
  private values: Record<EBotCondition, number>;

  constructor() {
    this.values = {
      [EBotCondition.Confused]: 0,
      [EBotCondition.Relaxed]: 0,
      [EBotCondition.Distracted]: 0,
    };
  }

  get(condition: EBotCondition): number {
    return this.values[condition];
  }

  /** Adds `amount`, clamped to [0, 100]. */
  increase(condition: EBotCondition, amount: number): void {
    const next = this.values[condition] + amount;
    this.values[condition] = Math.min(MAX_VALUE, Math.max(MIN_VALUE, next));
  }

  /** condition value >= BOT_CONDITION_THRESHOLD. */
  isActive(condition: EBotCondition): boolean {
    return this.values[condition] >= BOT_CONDITION_THRESHOLD;
  }

  /** Resets `condition` to 0 — called once it's been consumed for a bot move, regardless of whether it fired. */
  consume(condition: EBotCondition): void {
    this.values[condition] = 0;
  }
}
