import { OdysseyBattleRelic } from "./OdysseyBattleRelic.js";
import { ERelicType } from "../enums/ERelicType.js";
import { EBotCondition } from "../enums/EBotCondition.js";
import type { OdysseyBattle } from "./OdysseyBattle.js";
import type { OdysseyPlayer } from "./OdysseyPlayer.js";

export class OdysseyUndoRelic extends OdysseyBattleRelic {
  constructor(charges = 0) {
    super(ERelicType.Undo, "Relic of Undo", "+1 to max Undos.", charges);
  }

  /**
   * Undoes 1-2 plies (the bot's then the player's) so it's the player's
   * turn again; battle.botConditions.increase(Confused, 25).
   */
  applyInBattle(battle: OdysseyBattle, player: OdysseyPlayer): void {
    throw new Error("Not implemented");
  }
}
