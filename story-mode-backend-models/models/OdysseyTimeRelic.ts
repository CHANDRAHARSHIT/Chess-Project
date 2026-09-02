import { OdysseyBattleRelic } from "./OdysseyBattleRelic.js";
import { MIN_RELIC_CHARGES } from "./OdysseyRelic.js";
import { ERelicType } from "../enums/ERelicType.js";
import { ETimeDirection } from "../enums/ETimeDirection.js";
import { EBotCondition } from "../enums/EBotCondition.js";
import type { OdysseyBattle } from "./OdysseyBattle.js";
import type { OdysseyGame } from "./OdysseyGame.js";

const CLOCK_ADJUSTMENT_RATIO = 0.1;
const MIN_ENEMY_SECONDS = 1;
const RELAXED_INCREASE = 10;
const DISTRACTED_INCREASE = 20;

export class OdysseyTimeRelic extends OdysseyBattleRelic {
  constructor(charges: number = MIN_RELIC_CHARGES) {
    super(ERelicType.Time, "Relic of Haste", "+1 to max Time uses.", charges);
  }

  /**
   * IncreasePlayerClock: playerSeconds += floor(playerInitialSeconds * 0.1);
   *   botConditions.increase(Relaxed, 10).
   * DecreaseEnemyClock: enemySeconds = max(1, enemySeconds -
   *   floor(enemyInitialSeconds * 0.1)); botConditions.increase(Distracted, 20).
   */
  applyInBattle(battle: OdysseyBattle, game: OdysseyGame, direction: ETimeDirection = ETimeDirection.IncreasePlayerClock): void {
    if (!this.consume()) {
      return;
    }

    if (direction === ETimeDirection.IncreasePlayerClock) {
      battle.playerSeconds += Math.floor(battle.playerInitialSeconds * CLOCK_ADJUSTMENT_RATIO);
      battle.botConditions.increase(EBotCondition.Relaxed, RELAXED_INCREASE);
    } else {
      battle.enemySeconds = Math.max(
        MIN_ENEMY_SECONDS,
        battle.enemySeconds - Math.floor(battle.enemyInitialSeconds * CLOCK_ADJUSTMENT_RATIO)
      );
      battle.botConditions.increase(EBotCondition.Distracted, DISTRACTED_INCREASE);
    }
  }
}
