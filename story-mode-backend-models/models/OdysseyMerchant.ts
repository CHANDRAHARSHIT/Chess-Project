import { OdysseyShopItem } from "./OdysseyShopItem.js";
import type { ERelicType } from "../enums/ERelicType.js";
import type { OdysseyPlayer } from "./OdysseyPlayer.js";

export class OdysseyMerchant {
  catalog!: OdysseyShopItem[]; // full 5-type priced catalog, fixed for the visit
  offerings!: OdysseyShopItem[]; // 3 currently on display

  /**
   * Builds the full 5-type relic catalog, each with a randomized
   * per-charge price: max(5, 20 + rand[0..10] - 5), i.e. uniformly 15-25
   * coins per charge (the floor of 5 is unreachable given base 20).
   * Generated once per shop visit — OdysseyRerollRelic.applyInShop does
   * NOT re-roll these prices, only which 3 are shown.
   */
  static open(): OdysseyMerchant {
    throw new Error("Not implemented");
  }

  /** Picks 3 of the catalog's 5 items to display (shuffle-and-slice). */
  rollOfferings(count?: number): void {
    throw new Error("Not implemented");
  }

  /**
   * Buys `quantity` charges of `item.relicType` at
   * item.totalCost(quantity), applied directly to `player`. Quantity is
   * clamped via item.maxPurchasableQuantity(player's current charges for
   * that type). Blocked if the type isn't already owned AND
   * !player.hasFreeRelicSlot(). Each item can only be purchased once per
   * shop visit (tracked by the caller).
   */
  purchase(item: OdysseyShopItem, quantity: number, player: OdysseyPlayer): void {
    throw new Error("Not implemented");
  }

  /**
   * Sells one charge-slot of `relicType` for a flat 25 coins (regardless
   * of type or remaining charge count), applied to `player`. Removes the
   * relic from player.relics.
   */
  sell(relicType: ERelicType, player: OdysseyPlayer): { coinsGained: number } {
    throw new Error("Not implemented");
  }
}
