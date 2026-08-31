import { ERelicType } from "../enums/ERelicType.js";
import type { OdysseyPlayer } from "./OdysseyPlayer.js";

export class OdysseyRestSite {
  restores!: Partial<Record<ERelicType, number>>; // sums to <=5, one point at a time, uniform-random among uncapped types
  foundCoins!: number | null; // 15-35 inclusive, mutually exclusive with foundRelic
  foundRelic!: ERelicType | null; // uniform among unowned types; grants a full-charge relic instance

  /**
   * Distributes exactly 5 restore points one at a time, uniformly at
   * random, among the player's relics not yet at MAX_RELIC_CHARGES (stops
   * early, fewer than 5 total, if everything caps out first).
   *
   * Then rolls discovery (mutually exclusive — relic takes priority if
   * both fire):
   *   30% base chance to find coins: rand[15,35] inclusive
   *   10% base chance to find a new (unowned) relic type, uniform pick
   *   GUARANTEE: if 0 points were restored (everything already maxed),
   *     force a discovery — 50% relic (if any unowned & player.hasFreeRelicSlot()) else coins
   */
  static roll(player: OdysseyPlayer): OdysseyRestSite {
    throw new Error("Not implemented");
  }

  /**
   * Applies this rolled outcome to `player`:
   *   - adds each restores[type] to that relic's charges (auto-granting
   *     the relic via OdysseyRelic.create if the player doesn't own it yet
   *     — a rest can grant a relic slot without an explicit "found relic" event)
   *   - adds foundCoins to player.coins, if present
   *   - if foundRelic is present: grants it via player.addRelic if absent,
   *     sets its charges to MAX_RELIC_CHARGES (full refill)
   */
  applyTo(player: OdysseyPlayer): void {
    throw new Error("Not implemented");
  }
}
