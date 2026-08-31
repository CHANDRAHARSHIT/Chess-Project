import { OdysseyRelic } from "./OdysseyRelic.js";
import type { OdysseyMerchant } from "./OdysseyMerchant.js";
import type { OdysseyPlayer } from "./OdysseyPlayer.js";

/** A relic whose effect fires inside the shop. Today only Reroll is one. */
export abstract class OdysseyShopRelic extends OdysseyRelic {
  abstract applyInShop(merchant: OdysseyMerchant, player: OdysseyPlayer): void;
}
