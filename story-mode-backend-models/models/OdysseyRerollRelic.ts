import { OdysseyShopRelic } from "./OdysseyShopRelic.js";
import { MIN_RELIC_CHARGES } from "./OdysseyRelic.js";
import { ERelicType } from "../enums/ERelicType.js";
import type { OdysseyMerchant } from "./OdysseyMerchant.js";
import type { OdysseyGame } from "./OdysseyGame.js";

export class OdysseyRerollRelic extends OdysseyShopRelic {
  constructor(charges: number = MIN_RELIC_CHARGES) {
    super(ERelicType.Reroll, "Moirai's Thread", "+1 to max Rerolls.", charges);
  }

  /** Re-selects 3 offerings from the merchant's existing priced catalog (prices are not re-rolled). */
  applyInShop(merchant: OdysseyMerchant, game: OdysseyGame): void {
    if (!this.consume()) {
      return;
    }
    merchant.rollOfferings();
  }
}
