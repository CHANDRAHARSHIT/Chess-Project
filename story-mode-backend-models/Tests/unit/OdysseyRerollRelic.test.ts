import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyRerollRelic } from "../../models/OdysseyRerollRelic.js";
import { OdysseyMerchant } from "../../models/OdysseyMerchant.js";
import { makeGame } from "../support/factories.js";

describe("OdysseyRerollRelic", () => {
  test("test_applyInShop_rerollsMerchantOfferings", () => {
    const relic = new OdysseyRerollRelic(1);
    const merchant = OdysseyMerchant.open();
    relic.applyInShop(merchant, makeGame());
    assert.strictEqual(merchant.offerings.length, 3);
  });

  test("test_applyInShop_consumesOneCharge", () => {
    const relic = new OdysseyRerollRelic(2);
    const merchant = OdysseyMerchant.open();
    relic.applyInShop(merchant, makeGame());
    assert.strictEqual(relic.charges, 1);
  });

  test("test_applyInShop_doesNothingWhenNoChargesRemain", () => {
    const relic = new OdysseyRerollRelic(0);
    const merchant = OdysseyMerchant.open();
    const offeringsBefore = merchant.offerings;
    relic.applyInShop(merchant, makeGame());
    assert.strictEqual(merchant.offerings, offeringsBefore);
  });
});
