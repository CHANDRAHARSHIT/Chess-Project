import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyShopItem } from "../../models/OdysseyShopItem.js";
import { ERelicType } from "../../enums/ERelicType.js";

describe("OdysseyShopItem", () => {
  test("test_constructor_throwsWhenCostPerChargeBelowMinimum", () => {
    assert.throws(() => new OdysseyShopItem(ERelicType.Undo, 4), RangeError);
  });

  test("test_constructor_acceptsCostAtMinimum", () => {
    const item = new OdysseyShopItem(ERelicType.Undo, 5);
    assert.strictEqual(item.costPerCharge, 5);
  });

  test("test_totalCost_multipliesCostPerChargeByQuantity", () => {
    const item = new OdysseyShopItem(ERelicType.Hint, 20);
    assert.strictEqual(item.totalCost(3), 60);
  });

  test("test_maxPurchasableQuantity_returnsRemainingCapacity", () => {
    const item = new OdysseyShopItem(ERelicType.Hint, 20);
    assert.strictEqual(item.maxPurchasableQuantity(2), 3);
  });

  test("test_maxPurchasableQuantity_flooredAtZeroWhenAlreadyAtCap", () => {
    const item = new OdysseyShopItem(ERelicType.Hint, 20);
    assert.strictEqual(item.maxPurchasableQuantity(5), 0);
  });
});
