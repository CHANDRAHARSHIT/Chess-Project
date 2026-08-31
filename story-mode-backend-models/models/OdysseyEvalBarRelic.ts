import { OdysseyBattleRelic } from "./OdysseyBattleRelic.js";
import { ERelicType } from "../enums/ERelicType.js";
import type { OdysseyBattle } from "./OdysseyBattle.js";
import type { OdysseyPlayer } from "./OdysseyPlayer.js";

export class OdysseyEvalBarRelic extends OdysseyBattleRelic {
  constructor(charges = 0) {
    super(ERelicType.EvalBar, "Relic of Truth", "+1 to max Eval Bars.", charges);
  }

  /**
   * Grants +5 evalMovesRemaining (the window during which the eval bar is
   * shown, decremented by 1 per player move); battle.botConditions.increase(Relaxed, 15).
   */
  applyInBattle(battle: OdysseyBattle, player: OdysseyPlayer): void {
    throw new Error("Not implemented");
  }
}
