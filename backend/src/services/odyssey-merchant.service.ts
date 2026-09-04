import { OdysseyGameRepository } from "../repositories/OdysseyGameRepository.js";
import { OdysseyGameService } from "./odyssey-game.service.js";
import { OdysseyMerchant } from "../models/odyssey/models/OdysseyMerchant.js";
import { OdysseyShopItem } from "../models/odyssey/models/OdysseyShopItem.js";
import { OdysseyShopRelic } from "../models/odyssey/models/OdysseyShopRelic.js";
import type { OdysseyGame } from "../models/odyssey/models/OdysseyGame.js";
import { ERelicType } from "../models/odyssey/enums/ERelicType.js";

/**
 * The seed a shop visit's prices are derived from — deterministic per
 * (run, node), so the server can independently recompute a listing's true
 * price on purchase/reroll instead of trusting whatever the client sends,
 * with no shop-catalog persistence needed. See OdysseyMerchant.open.
 */
function merchantSeed(gameId: string, nodeId: number): string {
  return `${gameId}:${nodeId}`;
}

export class OdysseyMerchantService {
  /** Enters a merchant node and rolls its (deterministic, per-node) priced catalog + 3 offerings. */
  static async openShop(
    userId: string,
    slotId: number,
    nodeId: number
  ): Promise<{ game: OdysseyGame; catalog: OdysseyShopItem[]; offerings: OdysseyShopItem[] }> {
    const game = await OdysseyGameService.enterNode(userId, slotId, nodeId);
    const merchant = OdysseyMerchant.open(merchantSeed(game.id, nodeId));
    return { game, catalog: merchant.catalog, offerings: merchant.offerings };
  }

  /**
   * Buys `quantity` charges of `relicType` at that node's true (server-derived)
   * price — the client names what it wants, not what it costs. Server-
   * authoritative on every economic rule (price, affordability, slot
   * capacity, per-charge cap) via OdysseyMerchant.purchase()/OdysseyGame.
   */
  static async purchase(userId: string, slotId: number, nodeId: number, relicType: ERelicType, quantity: number): Promise<OdysseyGame> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    const merchant = OdysseyMerchant.open(merchantSeed(game.id, nodeId));
    const listing = merchant.catalog.find(item => item.relicType === relicType);
    if (!listing) {
      throw new Error(`No shop listing for relic type ${relicType} at node ${nodeId}.`);
    }
    merchant.purchase(listing, quantity, game);
    return OdysseyGameRepository.upsert(game);
  }

  static async sell(userId: string, slotId: number, relicType: ERelicType): Promise<{ game: OdysseyGame; coinsGained: number }> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    const merchant = new OdysseyMerchant();
    const { coinsGained } = merchant.sell(relicType, game);
    const savedGame = await OdysseyGameRepository.upsert(game);
    return { game: savedGame, coinsGained };
  }

  /** Spends a Reroll charge to re-select 3 offerings from that node's (unchanged, deterministic) catalog. */
  static async reroll(userId: string, slotId: number, nodeId: number): Promise<{ game: OdysseyGame; offerings: OdysseyShopItem[] }> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    const relic = game.getRelic(ERelicType.Reroll);
    if (!relic || !(relic instanceof OdysseyShopRelic)) {
      throw new Error("No Reroll relic charge available for this run.");
    }
    const merchant = OdysseyMerchant.open(merchantSeed(game.id, nodeId));
    relic.applyInShop(merchant, game); // consumes the charge and rolls fresh offerings from merchant.catalog
    const savedGame = await OdysseyGameRepository.upsert(game);
    return { game: savedGame, offerings: merchant.offerings };
  }

  /** Marks the merchant node completed once the caller leaves the shop — mirrors StoryModeMap's onComplete callback. */
  static async leaveShop(userId: string, slotId: number, nodeId: number): Promise<OdysseyGame> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    if (!game.canEnterNode(nodeId)) {
      throw new Error(`Node ${nodeId} is not currently reachable for this run — refusing to complete it.`);
    }
    game.completeNode(nodeId, false); // a merchant node is never the boss
    return OdysseyGameRepository.upsert(game);
  }
}
