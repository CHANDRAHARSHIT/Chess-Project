import { OdysseyShopItem } from "./OdysseyShopItem.js";
import { OdysseyRelicFactory } from "./OdysseyRelicFactory.js";
import { MAX_RELIC_CHARGES, MIN_RELIC_CHARGES } from "./OdysseyRelic.js";
import { createSeededRng } from "./seededRng.js";
import { ERelicType } from "../enums/ERelicType.js";
import type { OdysseyGame } from "./OdysseyGame.js";

const OFFERING_COUNT = 3;
const SELL_PRICE = 25;
const NO_COINS_GAINED = 0;
const PRICE_BASE = 20;
const PRICE_JITTER = 11; // rand[0..10]
const PRICE_JITTER_OFFSET = 5;
const PRICE_FLOOR = 5;
const NO_PURCHASABLE_QUANTITY = 0;
const SHUFFLE_COMPARATOR_MIDPOINT = 0.5;

const RELIC_TYPES: ERelicType[] = Object.values(ERelicType);

function rollPrice(rng: () => number): number {
  return Math.max(PRICE_FLOOR, PRICE_BASE + Math.floor(rng() * PRICE_JITTER) - PRICE_JITTER_OFFSET);
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => SHUFFLE_COMPARATOR_MIDPOINT - Math.random());
}

export class OdysseyMerchant {
  catalog!: OdysseyShopItem[]; // full 5-type priced catalog, fixed for the visit
  offerings!: OdysseyShopItem[]; // 3 currently on display
  private purchasedTypes: Set<ERelicType> = new Set();

  /**
   * Builds the full 5-type relic catalog, each with a per-charge price:
   * max(5, 20 + rand[0..10] - 5), i.e. uniformly 15-25 coins per charge
   * (the floor of 5 is unreachable given base 20). Generated once per shop
   * visit — OdysseyRerollRelic.applyInShop does NOT re-roll these prices,
   * only which 3 are shown.
   *
   * `seed` makes the catalog deterministic for a given (run, node) pair —
   * OdysseyMerchantService derives it from `${game.id}:${nodeId}` so the
   * server can independently recompute (and verify) a listing's true price
   * on purchase/reroll instead of trusting whatever the client sends,
   * without persisting a shop catalog. Since each merchant node is visited
   * exactly once per run, this is indistinguishable from true randomness
   * to the player. Omit `seed` for genuinely random prices (used by tests).
   */
  static open(seed?: string): OdysseyMerchant {
    const rng = seed ? createSeededRng(seed) : Math.random;
    const merchant = new OdysseyMerchant();
    merchant.catalog = RELIC_TYPES.map(type => new OdysseyShopItem(type, rollPrice(rng)));
    merchant.rollOfferings();
    return merchant;
  }

  /** Picks 3 of the catalog's 5 items to display (shuffle-and-slice). */
  rollOfferings(count: number = OFFERING_COUNT): void {
    this.offerings = shuffle(this.catalog).slice(0, count);
    this.purchasedTypes.clear();
  }

  /** Whether `type` was already bought during this shop visit (resets on rollOfferings). */
  private hasPurchased(type: ERelicType): boolean {
    return this.purchasedTypes.has(type);
  }

  /**
   * Buys `quantity` charges of `item.relicType` at
   * item.totalCost(quantity), applied directly to `game`. Quantity is
   * clamped via item.maxPurchasableQuantity(game's current charges for
   * that type). Blocked if !game.canAcquireRelic(item.relicType). Each
   * item can only be purchased once per shop visit.
   */
  purchase(item: OdysseyShopItem, quantity: number, game: OdysseyGame): void {
    if (this.hasPurchased(item.relicType)) {
      return;
    }

    if (!game.canAcquireRelic(item.relicType)) {
      return;
    }

    const owned = game.getRelic(item.relicType);
    const actualQuantity = Math.min(quantity, item.maxPurchasableQuantity(owned?.charges ?? MIN_RELIC_CHARGES));
    if (actualQuantity <= NO_PURCHASABLE_QUANTITY) {
      return;
    }

    const totalCost = item.totalCost(actualQuantity);
    if (!game.canAfford(totalCost)) {
      return;
    }

    game.addCoins(-totalCost);
    if (owned) {
      owned.charges = Math.min(MAX_RELIC_CHARGES, owned.charges + actualQuantity);
    } else {
      game.addRelic(OdysseyRelicFactory.create(item.relicType, actualQuantity));
    }

    this.purchasedTypes.add(item.relicType);
  }

  /**
   * Sells one charge-slot of `relicType` for a flat 25 coins (regardless
   * of type or remaining charge count), applied to `game`. Removes the
   * relic from game.relics.
   */
  sell(relicType: ERelicType, game: OdysseyGame): { coinsGained: number } {
    if (!game.ownsRelic(relicType)) {
      return { coinsGained: NO_COINS_GAINED };
    }
    game.removeRelic(relicType);
    game.addCoins(SELL_PRICE);
    return { coinsGained: SELL_PRICE };
  }
}
