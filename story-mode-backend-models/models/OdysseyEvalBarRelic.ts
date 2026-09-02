import { OdysseyBattleRelic } from "./OdysseyBattleRelic.js";
import { MIN_RELIC_CHARGES } from "./OdysseyRelic.js";
import { ERelicType } from "../enums/ERelicType.js";
import { EBotCondition } from "../enums/EBotCondition.js";
import type { OdysseyBattle } from "./OdysseyBattle.js";
import type { OdysseyGame } from "./OdysseyGame.js";

const EVAL_BAR_MOVE_WINDOW = 5;
const RELAXED_INCREASE = 15;

export class OdysseyEvalBarRelic extends OdysseyBattleRelic {
  constructor(charges: number = MIN_RELIC_CHARGES) {
    super(ERelicType.EvalBar, "Relic of Truth", "+1 to max Eval Bars.", charges);
  }

  /**
   * Grants +5 evalMovesRemaining (the window during which the eval bar is
   * shown, decremented by 1 per player move); battle.botConditions.increase(Relaxed, 15).
   */
  applyInBattle(battle: OdysseyBattle, game: OdysseyGame): void {
    if (!this.consume()) {
      return;
    }
    battle.evalMovesRemaining += EVAL_BAR_MOVE_WINDOW;
    battle.botConditions.increase(EBotCondition.Relaxed, RELAXED_INCREASE);
  }
}
