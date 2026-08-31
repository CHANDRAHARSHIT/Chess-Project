import { ERelicType } from "../enums/ERelicType.js";
import { OdysseyRelicFactory } from "./OdysseyRelicFactory.js";
import { MAX_RELIC_CHARGES } from "./OdysseyRelic.js";
import type { OdysseyGame } from "./OdysseyGame.js";

const ALL_RELIC_TYPES: ERelicType[] = Object.values(ERelicType);
const REST_POINTS = 5;
const COIN_FIND_CHANCE = 0.3;
const RELIC_FIND_CHANCE = 0.1;
const FORCED_RELIC_CHANCE = 0.5;
const COIN_MIN = 15;
const COIN_MAX = 35;

export class OdysseyRestSite {
  restores!: Partial<Record<ERelicType, number>>; // sums to <=5, one point at a time, uniform-random among uncapped types
  foundCoins!: number | null; // 15-35 inclusive, mutually exclusive with foundRelic
  foundRelic!: ERelicType | null; // uniform among unowned types; grants a full-charge relic instance

  /**
   * Distributes exactly 5 restore points one at a time, uniformly at
   * random, among the run's relics not yet at MAX_RELIC_CHARGES (stops
   * early, fewer than 5 total, if everything caps out first).
   *
   * Then rolls discovery (mutually exclusive — relic takes priority if
   * both fire):
   *   30% base chance to find coins: rand[15,35] inclusive
   *   10% base chance to find a new (unowned) relic type, uniform pick
   *   GUARANTEE: if 0 points were restored (everything already maxed),
   *     force a discovery — 50% relic (if any unowned & game.hasFreeRelicSlot()) else coins
   */
  static roll(game: OdysseyGame): OdysseyRestSite {
    const site = new OdysseyRestSite();
    const restores: Partial<Record<ERelicType, number>> = {};
    let remainingPoints = REST_POINTS;

    const projectedCharges = (type: ERelicType) => (game.getRelic(type)?.charges ?? 0) + (restores[type] ?? 0);

    while (remainingPoints > 0) {
      const eligible = ALL_RELIC_TYPES.filter(type => projectedCharges(type) < MAX_RELIC_CHARGES);
      if (eligible.length === 0) {
        break;
      }
      const pick = eligible[Math.floor(Math.random() * eligible.length)];
      restores[pick] = (restores[pick] ?? 0) + 1;
      remainingPoints -= 1;
    }

    const restoredPoints = REST_POINTS - remainingPoints;
    const unowned = ALL_RELIC_TYPES.filter(type => !game.ownsRelic(type));

    let willFindRelic = Math.random() < RELIC_FIND_CHANCE;
    let willFindCoins = Math.random() < COIN_FIND_CHANCE;

    if (restoredPoints === 0) {
      if (unowned.length > 0 && Math.random() < FORCED_RELIC_CHANCE) {
        willFindRelic = true;
      } else {
        willFindCoins = true;
      }
    }

    site.restores = restores;
    site.foundCoins = null;
    site.foundRelic = null;

    if (willFindRelic && unowned.length > 0 && game.hasFreeRelicSlot()) {
      site.foundRelic = unowned[Math.floor(Math.random() * unowned.length)];
    } else if (willFindCoins) {
      site.foundCoins = Math.floor(Math.random() * (COIN_MAX - COIN_MIN + 1)) + COIN_MIN;
    }

    return site;
  }

  /**
   * Applies this rolled outcome to `game`:
   *   - adds each restores[type] to that relic's charges (auto-granting
   *     the relic via OdysseyRelicFactory if the run doesn't own it yet —
   *     a rest can grant a relic slot without an explicit "found relic" event)
   *   - adds foundCoins to game.coins, if present
   *   - if foundRelic is present: grants it via game.addRelic if absent,
   *     sets its charges to MAX_RELIC_CHARGES (full refill)
   */
  applyTo(game: OdysseyGame): void {
    for (const [type, amount] of Object.entries(this.restores) as [ERelicType, number][]) {
      const owned = game.getRelic(type);
      if (owned) {
        owned.charges = Math.min(MAX_RELIC_CHARGES, owned.charges + amount);
      } else {
        game.addRelic(OdysseyRelicFactory.create(type, amount));
      }
    }

    if (this.foundCoins !== null) {
      game.addCoins(this.foundCoins);
    }

    if (this.foundRelic !== null) {
      const owned = game.getRelic(this.foundRelic);
      if (owned) {
        owned.charges = MAX_RELIC_CHARGES;
      } else {
        game.addRelic(OdysseyRelicFactory.create(this.foundRelic, MAX_RELIC_CHARGES));
      }
    }
  }
}
