import { ERelicType } from "../enums/ERelicType.js";
import { MAX_RELIC_CHARGES } from "./OdysseyRelic.js";

/**
 * A purchasable listing in OdysseyMerchant's offerings — NOT the same as
 * an owned OdysseyRelic instance. A class rather than a plain data shape
 * because it owns real behavior (totalCost/maxPurchasableQuantity, both
 * previously computed inline in the merchant purchase flow) and a
 * constructor that can enforce its own invariant on the way in.
 */
export class OdysseyShopItem {
  readonly relicType: ERelicType;
  readonly costPerCharge: number; // uniformly 15-25, see OdysseyMerchant.generatePricedCatalog

  /** Validates costPerCharge falls in the game's valid price band before assigning. */
  constructor(relicType: ERelicType, costPerCharge: number) {
    throw new Error("Not implemented");
  }

  /** cost * quantity — linear, no bulk discount. */
  totalCost(quantity: number): number {
    throw new Error("Not implemented");
  }

  /** MAX_RELIC_CHARGES - currentCharges, floored at 0. */
  maxPurchasableQuantity(currentCharges: number): number {
    throw new Error("Not implemented");
  }
}
