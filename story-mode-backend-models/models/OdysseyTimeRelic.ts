import { OdysseyBattleRelic } from "./OdysseyBattleRelic.js";
import { ERelicType } from "../enums/ERelicType.js";
import { ETimeDirection } from "../enums/ETimeDirection.js";
import type { OdysseyBattle } from "./OdysseyBattle.js";
import type { OdysseyPlayer } from "./OdysseyPlayer.js";

export class OdysseyTimeRelic extends OdysseyBattleRelic {
  constructor(charges = 0) {
    super(ERelicType.Time, "Relic of Haste", "+1 to max Time uses.", charges);
  }

  /**
   * IncreasePlayerClock: playerSeconds += floor(playerInitialSeconds * 0.1);
   *   botConditions.increase(Relaxed, 10).
   * DecreaseEnemyClock: enemySeconds = max(1, enemySeconds -
   *   floor(enemyInitialSeconds * 0.1)); botConditions.increase(Distracted, 20).
   */
  applyInBattle(battle: OdysseyBattle, player: OdysseyPlayer, direction: ETimeDirection = ETimeDirection.IncreasePlayerClock): void {
    throw new Error("Not implemented");
  }
}
