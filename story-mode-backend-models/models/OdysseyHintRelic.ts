import { OdysseyBattleRelic } from "./OdysseyBattleRelic.js";
import { ERelicType } from "../enums/ERelicType.js";
import { EBotCondition } from "../enums/EBotCondition.js";
import type { OdysseyBattle } from "./OdysseyBattle.js";
import type { OdysseyGame } from "./OdysseyGame.js";

export class OdysseyHintRelic extends OdysseyBattleRelic {
  constructor(charges = 0) {
    super(ERelicType.Hint, "Relic of Oracle", "+1 to max Hints.", charges);
  }

  /**
   * Runs a 2500ms engine analysis for an arrow overlay, auto-dismissed
   * after 4000ms; battle.botConditions.increase(Distracted, 15).
   *
   * The actual analysis call is the caller's job (it owns the engine
   * connection) — this only spends the charge and applies the meta-effect.
   */
  applyInBattle(battle: OdysseyBattle, game: OdysseyGame): void {
    if (!this.consume()) {
      return;
    }
    battle.botConditions.increase(EBotCondition.Distracted, 15);
  }
}
