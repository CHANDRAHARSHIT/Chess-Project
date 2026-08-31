import { OdysseyShopItem } from "./OdysseyShopItem.js";
import { OdysseyRelicFactory } from "./OdysseyRelicFactory.js";
import { MAX_RELIC_CHARGES } from "./OdysseyRelic.js";
import { ERelicType } from "../enums/ERelicType.js";
import type { OdysseyGame } from "./OdysseyGame.js";

const OFFERING_COUNT = 3;
const SELL_PRICE = 25;
const PRICE_BASE = 20;
const PRICE_JITTER = 11; // rand[0..10]
const PRICE_JITTER_OFFSET = 5;
const PRICE_FLOOR = 5;

const RELIC_TYPES: ERelicType[] = Object.values(ERelicType);

function rollPrice(): number {
  return Math.max(PRICE_FLOOR, PRICE_BASE + Math.floor(Math.random() * PRICE_JITTER) - PRICE_JITTER_OFFSET);
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => 0.5 - Math.random());
}

export class OdysseyMerchant {
  catalog!: OdysseyShopItem[]; // full 5-type priced catalog, fixed for the visit
  offerings!: OdysseyShopItem[]; // 3 currently on display
  private purchasedTypes: Set<ERelicType> = new Set();

  /**
   * Builds the full 5-type relic catalog, each with a randomized
   * per-charge price: max(5, 20 + rand[0..10] - 5), i.e. uniformly 15-25
   * coins per charge (the floor of 5 is unreachable given base 20).
   * Generated once per shop visit — OdysseyRerollRelic.applyInShop does
   * NOT re-roll these prices, only which 3 are shown.
   */
  static open(): OdysseyMerchant {
    const merchant = new OdysseyMerchant();
    merchant.catalog = RELIC_TYPES.map(type => new OdysseyShopItem(type, rollPrice()));
    merchant.rollOfferings();
    return merchant;
  }

  /** Picks 3 of the catalog's 5 items to display (shuffle-and-slice). */
  rollOfferings(count: number = OFFERING_COUNT): void {
    this.offerings = shuffle(this.catalog).slice(0, count);
    this.purchasedTypes.clear();
  }

  /**
   * Buys `quantity` charges of `item.relicType` at
   * item.totalCost(quantity), applied directly to `game`. Quantity is
   * clamped via item.maxPurchasableQuantity(game's current charges for
   * that type). Blocked if the type isn't already owned AND
   * !game.hasFreeRelicSlot(). Each item can only be purchased once per
   * shop visit.
   */
  purchase(item: OdysseyShopItem, quantity: number, game: OdysseyGame): void {
    if (this.purchasedTypes.has(item.relicType)) {
      return;
    }

    const owned = game.getRelic(item.relicType);
    if (!owned && !game.hasFreeRelicSlot()) {
      return;
    }

    const actualQuantity = Math.min(quantity, item.maxPurchasableQuantity(owned?.charges ?? 0));
    if (actualQuantity <= 0) {
      return;
    }

    const totalCost = item.totalCost(actualQuantity);
    if (game.coins < totalCost) {
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
      return { coinsGained: 0 };
    }
    game.removeRelic(relicType);
    game.addCoins(SELL_PRICE);
    return { coinsGained: SELL_PRICE };
  }
}
