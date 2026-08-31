import { OdysseyRelic } from "./OdysseyRelic.js";
import type { ETimeDirection } from "../enums/ETimeDirection.js";
import type { OdysseyBattle } from "./OdysseyBattle.js";
import type { OdysseyPlayer } from "./OdysseyPlayer.js";

/**
 * A relic whose effect fires mid-battle (Undo/Hint/EvalBar/Time). Each
 * concrete subclass owns its own rule instead of OdysseyBattle switching
 * on an action string — replaces the old applyChargeAction() dispatcher.
 */
export abstract class OdysseyBattleRelic extends OdysseyRelic {
  /**
   * `direction` is only meaningful for OdysseyTimeRelic (increase player /
   * decrease enemy clock); other relics ignore it. Declared here so every
   * override shares one call signature.
   */
  abstract applyInBattle(battle: OdysseyBattle, player: OdysseyPlayer, direction?: ETimeDirection): void;
}
