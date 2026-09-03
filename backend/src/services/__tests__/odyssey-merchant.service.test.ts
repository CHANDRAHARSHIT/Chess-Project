import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { OdysseyMerchantService } from "../odyssey-merchant.service.js";
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
    const game = await OdysseyMerchantService.purchase(
      userId,
      2,
      { relicType: listing.relicType, costPerCharge: listing.costPerCharge },
      1
    );

    assert.ok(game.ownsRelic(listing.relicType));
    assert.strictEqual(game.coins, startingCoins - listing.costPerCharge);
  });

  test("test_purchase_doesNothingWhenTheRunCannotAffordIt", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 3, ENodeType.Merchant);
    const { game: shopGame, catalog } = await OdysseyMerchantService.openShop(userId, 3, node.id);
    shopGame.coins = 0;
    await OdysseyGameRepository.upsert(shopGame);

    const listing = catalog[0];
    const game = await OdysseyMerchantService.purchase(
      userId,
      3,
      { relicType: listing.relicType, costPerCharge: listing.costPerCharge },
      1
    );

    assert.strictEqual(game.coins, 0);
    assert.strictEqual(game.ownsRelic(listing.relicType), false);
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

  test("test_reroll_consumesAChargeAndReturnsFreshOfferingsFromTheGivenCatalog", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 5, ENodeType.Merchant);
    const { catalog } = await OdysseyMerchantService.openShop(userId, 5, node.id);

    const rerollGame = await OdysseyGameRepository.findBySlot(userId, 5);
    rerollGame!.relics = [OdysseyRelicFactory.create(ERelicType.Reroll, 1)];
    await OdysseyGameRepository.upsert(rerollGame!);

    const payload = catalog.map(item => ({ relicType: item.relicType, costPerCharge: item.costPerCharge }));
    const { game, offerings } = await OdysseyMerchantService.reroll(userId, 5, payload);

    assert.strictEqual(offerings.length, 3);
    assert.strictEqual(game.getRelic(ERelicType.Reroll)!.charges, 0);
  });

  test("test_reroll_throwsWhenNoRerollRelicIsOwned", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 6, ENodeType.Merchant);
    const { catalog } = await OdysseyMerchantService.openShop(userId, 6, node.id);
    const payload = catalog.map(item => ({ relicType: item.relicType, costPerCharge: item.costPerCharge }));

    await assert.rejects(OdysseyMerchantService.reroll(userId, 6, payload));
  });

  test("test_leaveShop_completesTheMerchantNode", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 7, ENodeType.Merchant);

    const game = await OdysseyMerchantService.leaveShop(userId, 7, node.id);

    assert.ok(game.completedNodes.includes(node.id));
    assert.strictEqual(game.journeyComplete, false);
  });
});
