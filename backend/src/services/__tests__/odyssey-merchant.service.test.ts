import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { OdysseyMerchantService } from "../odyssey-merchant.service.js";
import { OdysseyGameService } from "../odyssey-game.service.js";
import { OdysseyGameRepository } from "../../repositories/OdysseyGameRepository.js";
import { OdysseyRelicFactory } from "../../models/odyssey/models/OdysseyRelicFactory.js";
import { ERelicType } from "../../models/odyssey/enums/ERelicType.js";
import { ENodeType } from "../../models/odyssey/enums/ENodeType.js";
import { createTestUser, deleteTestUser, makeGameWithEnterableNode } from "../../testSupport/odysseyTestSupport.js";

describe("OdysseyMerchantService", () => {
  let userId: string;

  before(async () => {
    userId = await createTestUser("merchant");
  });

  after(async () => {
    await deleteTestUser(userId);
  });

  test("test_openShop_returnsAFiveItemCatalogAndThreeOfferingsAndPersistsCurrentNodeId", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 1, ENodeType.Merchant);
    const { game, catalog, offerings } = await OdysseyMerchantService.openShop(userId, 1, node.id);

    assert.strictEqual(catalog.length, 5);
    assert.strictEqual(offerings.length, 3);
    assert.strictEqual(game.currentNodeId, node.id);
  });

  test("test_purchase_deductsCoinsAndGrantsARelicWhenAffordable", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 2, ENodeType.Merchant);
    const { game: shopGame, catalog } = await OdysseyMerchantService.openShop(userId, 2, node.id);

    const startingCoins = shopGame.coins;
    const listing = catalog[0];
    const game = await OdysseyMerchantService.purchase(userId, 2, node.id, listing.relicType, 1);

    assert.ok(game.ownsRelic(listing.relicType));
    assert.strictEqual(game.coins, startingCoins - listing.costPerCharge);
  });

  test("test_purchase_doesNothingWhenTheRunCannotAffordIt", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 3, ENodeType.Merchant);
    const { game: shopGame, catalog } = await OdysseyMerchantService.openShop(userId, 3, node.id);
    shopGame.coins = 0;
    await OdysseyGameRepository.upsert(shopGame);

    const listing = catalog[0];
    const game = await OdysseyMerchantService.purchase(userId, 3, node.id, listing.relicType, 1);

    assert.strictEqual(game.coins, 0);
    assert.strictEqual(game.ownsRelic(listing.relicType), false);
  });

  test("test_purchase_isServerAuthoritative_ignoresWhateverPriceTheCallerMightExpect", async () => {
    // The server never accepts a client-supplied price in the first place — this
    // confirms the SAME (game, node) always resolves to the SAME real price,
    // regardless of how many times it's independently recomputed.
    const { node } = await makeGameWithEnterableNode(userId, 10, ENodeType.Merchant);
    const { catalog } = await OdysseyMerchantService.openShop(userId, 10, node.id);
    const listing = catalog[0];

    const gameBefore = await OdysseyGameRepository.findBySlot(userId, 10);
    const game = await OdysseyMerchantService.purchase(userId, 10, node.id, listing.relicType, 1);

    assert.strictEqual(game.coins, gameBefore!.coins - listing.costPerCharge);
  });

  test("test_sell_returnsFlatCoinsAndRemovesTheRelic", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 4, ENodeType.Merchant);
    const shopGame = await OdysseyGameRepository.findBySlot(userId, 4);
    shopGame!.relics = [OdysseyRelicFactory.create(ERelicType.Undo, 2)];
    await OdysseyGameRepository.upsert(shopGame!);

    const { game, coinsGained } = await OdysseyMerchantService.sell(userId, 4, ERelicType.Undo);

    assert.strictEqual(coinsGained, 25);
    assert.strictEqual(game.ownsRelic(ERelicType.Undo), false);
  });

  test("test_reroll_consumesAChargeAndReturnsFreshOfferingsFromTheSameDeterministicCatalog", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 5, ENodeType.Merchant);
    const { catalog } = await OdysseyMerchantService.openShop(userId, 5, node.id);

    const rerollGame = await OdysseyGameRepository.findBySlot(userId, 5);
    rerollGame!.relics = [OdysseyRelicFactory.create(ERelicType.Reroll, 1)];
    await OdysseyGameRepository.upsert(rerollGame!);

    const { game, offerings } = await OdysseyMerchantService.reroll(userId, 5, node.id);

    assert.strictEqual(offerings.length, 3);
    assert.strictEqual(game.getRelic(ERelicType.Reroll)!.charges, 0);
    // Same seed (game.id + node.id) -> same catalog every time, just a different 3-of-5 selection.
    for (const offering of offerings) {
      const original = catalog.find(item => item.relicType === offering.relicType);
      assert.strictEqual(offering.costPerCharge, original?.costPerCharge);
    }
  });

  test("test_reroll_throwsWhenNoRerollRelicIsOwned", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 6, ENodeType.Merchant);
    await OdysseyMerchantService.openShop(userId, 6, node.id);

    await assert.rejects(OdysseyMerchantService.reroll(userId, 6, node.id));
  });

  test("test_leaveShop_completesTheMerchantNode", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 7, ENodeType.Merchant);

    const game = await OdysseyMerchantService.leaveShop(userId, 7, node.id);

    assert.ok(game.completedNodes.includes(node.id));
    assert.strictEqual(game.journeyComplete, false);
  });

  test("test_leaveShop_throwsForANodeThatWasNeverMadeReachable", async () => {
    const game = await OdysseyGameService.startNewRun(userId, 8);
    const startNode = game.map.getNode(0)!;
    const unreachable = game.map.nodes.find(n => n.id !== 0 && !startNode.isAdjacentTo(n.id));
    assert.ok(unreachable, "expected a node beyond floor 1 in a freshly generated map");

    await assert.rejects(OdysseyMerchantService.leaveShop(userId, 8, unreachable!.id));

    const reloaded = await OdysseyGameRepository.findBySlot(userId, 8);
    assert.strictEqual(reloaded!.completedNodes.includes(unreachable!.id), false);
  });
});
