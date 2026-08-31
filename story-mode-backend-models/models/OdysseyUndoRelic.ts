import { OdysseyBattleRelic } from "./OdysseyBattleRelic.js";
import { ERelicType } from "../enums/ERelicType.js";
import { EBotCondition } from "../enums/EBotCondition.js";
import type { OdysseyBattle } from "./OdysseyBattle.js";
import type { OdysseyGame } from "./OdysseyGame.js";

export class OdysseyUndoRelic extends OdysseyBattleRelic {
  constructor(charges = 0) {
    super(ERelicType.Undo, "Relic of Undo", "+1 to max Undos.", charges);
  }

  /**
   * Undoes 1-2 plies (the bot's then the player's) so it's the player's
   * turn again; battle.botConditions.increase(Confused, 25).
   *
   * The actual board rewind is the caller's job (it owns the live chess
   * position, not this model) — this only spends the charge and applies
   * the meta-effect on the battle.
   */
  applyInBattle(battle: OdysseyBattle, game: OdysseyGame): void {
    if (!this.consume()) {
      return;
    }
    battle.botConditions.increase(EBotCondition.Confused, 25);
  }
}
