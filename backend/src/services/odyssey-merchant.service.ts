import { OdysseyGameRepository } from "../repositories/OdysseyGameRepository.js";
import { OdysseyGameService } from "./odyssey-game.service.js";
import { OdysseyMerchant } from "../models/odyssey/models/OdysseyMerchant.js";
import { OdysseyShopItem } from "../models/odyssey/models/OdysseyShopItem.js";
import { OdysseyShopRelic } from "../models/odyssey/models/OdysseyShopRelic.js";
import type { OdysseyGame } from "../models/odyssey/models/OdysseyGame.js";
import { ERelicType } from "../models/odyssey/enums/ERelicType.js";

/**
 * A shop listing as seen by the caller. Matches OdysseyShopItem's fields —
 * the catalog/offerings a shop visit generates aren't persisted (they're
 * per-visit, ephemeral, exactly like the frontend's `availablePool` React
 * state), so the caller resends the listing it's acting on with each
 * purchase/sell/reroll call instead of the server remembering a "visit".
 */
export interface OdysseyShopItemPayload {
  relicType: ERelicType;
  costPerCharge: number;
}

function toModel(item: OdysseyShopItemPayload): OdysseyShopItem {
  return new OdysseyShopItem(item.relicType, item.costPerCharge); // validates the price band itself
}

export class OdysseyMerchantService {
  /** Enters a merchant node and rolls a fresh priced catalog + 3 offerings. */
  static async openShop(
    userId: string,
    slotId: number,
    nodeId: number
  ): Promise<{ game: OdysseyGame; catalog: OdysseyShopItem[]; offerings: OdysseyShopItem[] }> {
    const game = await OdysseyGameService.enterNode(userId, slotId, nodeId);
    const merchant = OdysseyMerchant.open();
    return { game, catalog: merchant.catalog, offerings: merchant.offerings };
  }

  /**
   * Buys `quantity` charges of the given listing. Server-authoritative on
   * every economic rule (affordability, slot capacity, per-charge cap) via
   * OdysseyMerchant.purchase()/OdysseyGame — NOT on whether this exact
   * listing/price was actually the one most recently offered, since the
   * catalog isn't persisted. This mirrors the frontend's own trust model
   * (everything client-supplied is trusted) rather than adding a session
   * store this pass; flagged as a known gap if server-authoritative
   * pricing is wanted later.
   */
  static async purchase(userId: string, slotId: number, item: OdysseyShopItemPayload, quantity: number): Promise<OdysseyGame> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    const merchant = new OdysseyMerchant();
    merchant.purchase(toModel(item), quantity, game);
    return OdysseyGameRepository.upsert(game);
  }

  static async sell(userId: string, slotId: number, relicType: ERelicType): Promise<{ game: OdysseyGame; coinsGained: number }> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    const merchant = new OdysseyMerchant();
    const { coinsGained } = merchant.sell(relicType, game);
    const savedGame = await OdysseyGameRepository.upsert(game);
    return { game: savedGame, coinsGained };
  }

  /** Spends a Reroll charge to re-select 3 offerings from the given (unchanged) catalog. */
  static async reroll(
    userId: string,
    slotId: number,
    catalog: OdysseyShopItemPayload[]
  ): Promise<{ game: OdysseyGame; offerings: OdysseyShopItem[] }> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    const relic = game.getRelic(ERelicType.Reroll);
    if (!relic || !(relic instanceof OdysseyShopRelic)) {
      throw new Error("No Reroll relic charge available for this run.");
    }
    const merchant = new OdysseyMerchant();
    merchant.catalog = catalog.map(toModel);
    relic.applyInShop(merchant, game); // consumes the charge and rolls fresh offerings from merchant.catalog
    const savedGame = await OdysseyGameRepository.upsert(game);
    return { game: savedGame, offerings: merchant.offerings };
  }

  /** Marks the merchant node completed once the caller leaves the shop — mirrors StoryModeMap's onComplete callback. */
  static async leaveShop(userId: string, slotId: number, nodeId: number): Promise<OdysseyGame> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    game.completeNode(nodeId, false); // a merchant node is never the boss
    return OdysseyGameRepository.upsert(game);
  }
}
