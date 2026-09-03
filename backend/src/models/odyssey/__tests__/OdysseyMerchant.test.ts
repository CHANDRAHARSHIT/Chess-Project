import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyMerchant } from "../models/OdysseyMerchant.js";
import { OdysseyRelicFactory } from "../models/OdysseyRelicFactory.js";
import { MAX_RELIC_CHARGES } from "../models/OdysseyRelic.js";
import { ERelicType } from "../enums/ERelicType.js";
import { makeGame } from "./factories.js";

describe("OdysseyMerchant", () => {
  test("test_open_buildsACatalogWithAllFiveRelicTypes", () => {
    const merchant = OdysseyMerchant.open();
    assert.strictEqual(merchant.catalog.length, 5);
    assert.strictEqual(new Set(merchant.catalog.map(item => item.relicType)).size, 5);
  });

  test("test_open_pricesEachItemInTheValidRange", () => {
    const merchant = OdysseyMerchant.open();
    for (const item of merchant.catalog) {
      assert.ok(item.costPerCharge >= 15 && item.costPerCharge <= 25, `price ${item.costPerCharge} out of range`);
    }
  });

  test("test_rollOfferings_selectsThreeItemsByDefault", () => {
    const merchant = OdysseyMerchant.open();
    merchant.rollOfferings();
    assert.strictEqual(merchant.offerings.length, 3);
  });

  test("test_purchase_deductsCoinsAndGrantsRelicWhenAffordable", () => {
    const merchant = OdysseyMerchant.open();
    const game = makeGame({ coins: 1000 });
    const item = merchant.catalog[0];
    merchant.purchase(item, 2, game);
    assert.strictEqual(game.ownsRelic(item.relicType), true);
    assert.strictEqual(game.coins, 1000 - item.totalCost(2));
  });

  test("test_purchase_doesNothingWhenGameCannotAffordIt", () => {
    const merchant = OdysseyMerchant.open();
    const game = makeGame({ coins: 0 });
    const item = merchant.catalog[0];
    merchant.purchase(item, 1, game);
    assert.strictEqual(game.ownsRelic(item.relicType), false);
  });

  test("test_purchase_blocksASecondPurchaseOfTheSameItemInOneVisit", () => {
    const merchant = OdysseyMerchant.open();
    const game = makeGame({ coins: 1000 });
    const item = merchant.catalog[0];
    merchant.purchase(item, 1, game);
    const chargesAfterFirst = game.getRelic(item.relicType)!.charges;
    merchant.purchase(item, 1, game);
    assert.strictEqual(game.getRelic(item.relicType)!.charges, chargesAfterFirst);
  });

  test("test_purchase_clampsQuantityToRemainingCapacity", () => {
    const merchant = OdysseyMerchant.open();
    const game = makeGame({ coins: 1000 });
    const item = merchant.catalog[0];
    merchant.purchase(item, 100, game);
    assert.strictEqual(game.getRelic(item.relicType)!.charges, MAX_RELIC_CHARGES);
  });

  test("test_purchase_blocksNewRelicTypeWhenNoFreeRelicSlotRemains", () => {
    const merchant = OdysseyMerchant.open();
    const game = makeGame({ coins: 100000 });
    // Fills all 5 slots without owning Reroll, so the "no free slot" guard
    // can be exercised in isolation. With today's fixed 5 relic types, a
    // player can never actually reach this state through normal play —
    // owning 5 distinct relics IS owning all of them. This guard is
    // effectively unreachable dead code until a 6th relic type exists;
    // flagging that rather than leaving it silently untested.
    game.relics = [
      OdysseyRelicFactory.create(ERelicType.Undo, 1),
      OdysseyRelicFactory.create(ERelicType.Hint, 1),
      OdysseyRelicFactory.create(ERelicType.EvalBar, 1),
      OdysseyRelicFactory.create(ERelicType.Time, 1),
      OdysseyRelicFactory.create(ERelicType.Undo, 1),
    ];
    const rerollItem = merchant.catalog.find(item => item.relicType === ERelicType.Reroll)!;
    merchant.purchase(rerollItem, 1, game);
    assert.strictEqual(game.ownsRelic(ERelicType.Reroll), false);
  });

  test("test_sell_returns25CoinsAndRemovesRelic", () => {
    const merchant = OdysseyMerchant.open();
    const game = makeGame({ coins: 0, relics: [OdysseyRelicFactory.create(ERelicType.Undo, 3)] });
    const result = merchant.sell(ERelicType.Undo, game);
    assert.strictEqual(result.coinsGained, 25);
    assert.strictEqual(game.coins, 25);
    assert.strictEqual(game.ownsRelic(ERelicType.Undo), false);
  });

  test("test_sell_doesNothingWhenRelicNotOwned", () => {
    const merchant = OdysseyMerchant.open();
    const game = makeGame({ coins: 0 });
    const result = merchant.sell(ERelicType.Undo, game);
    assert.strictEqual(result.coinsGained, 0);
    assert.strictEqual(game.coins, 0);
  });
});
