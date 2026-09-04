import { ERelicType } from "../enums/ERelicType.js";
import { MAX_RELIC_CHARGES, MIN_RELIC_CHARGES } from "./OdysseyRelic.js";

const MIN_COST_PER_CHARGE = 5; // the floor from OdysseyMerchant's price roll: max(5, 20 + rand[0..10] - 5)

/**
 * A purchasable listing in OdysseyMerchant's offerings — NOT the same as
 * an owned OdysseyRelic instance. A class rather than a plain data shape
 * because it owns real behavior (totalCost/maxPurchasableQuantity, both
 * previously computed inline in the merchant purchase flow) and a
 * constructor that can enforce its own invariant on the way in.
 */
export class OdysseyShopItem {
  readonly relicType: ERelicType;
  readonly costPerCharge: number; // uniformly 15-25, see OdysseyMerchant.open

  /** Validates costPerCharge falls in the game's valid price band before assigning. */
  constructor(relicType: ERelicType, costPerCharge: number) {
    if (costPerCharge < MIN_COST_PER_CHARGE) {
      throw new RangeError(`costPerCharge must be at least ${MIN_COST_PER_CHARGE}, got ${costPerCharge}`);
    }
    this.relicType = relicType;
    this.costPerCharge = costPerCharge;
  }

  /** cost * quantity — linear, no bulk discount. */
  totalCost(quantity: number): number {
    return this.costPerCharge * quantity;
  }

  /** MAX_RELIC_CHARGES - currentCharges, floored at MIN_RELIC_CHARGES. */
  maxPurchasableQuantity(currentCharges: number): number {
    return Math.max(MIN_RELIC_CHARGES, MAX_RELIC_CHARGES - currentCharges);
  }
}
