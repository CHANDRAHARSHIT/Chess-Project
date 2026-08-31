import { OdysseyBattleRelic } from "./OdysseyBattleRelic.js";
import { ERelicType } from "../enums/ERelicType.js";
import type { OdysseyBattle } from "./OdysseyBattle.js";
import type { OdysseyPlayer } from "./OdysseyPlayer.js";

export class OdysseyHintRelic extends OdysseyBattleRelic {
  constructor(charges = 0) {
    super(ERelicType.Hint, "Relic of Oracle", "+1 to max Hints.", charges);
  }

  /**
   * Runs a 2500ms engine analysis for an arrow overlay, auto-dismissed
   * after 4000ms; battle.botConditions.increase(Distracted, 15).
   */
  applyInBattle(battle: OdysseyBattle, player: OdysseyPlayer): void {
    throw new Error("Not implemented");
  }
}
