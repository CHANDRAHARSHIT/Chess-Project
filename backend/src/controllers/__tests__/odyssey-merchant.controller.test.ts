import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { OdysseyMerchantController } from "../odyssey-merchant.controller.js";
import { OdysseyGameRepository } from "../../repositories/OdysseyGameRepository.js";
import { OdysseyRelicFactory } from "../../models/odyssey/models/OdysseyRelicFactory.js";
import { ERelicType } from "../../models/odyssey/enums/ERelicType.js";
import { ENodeType } from "../../models/odyssey/enums/ENodeType.js";
import {
  createTestUser,
  deleteTestUser,
  makeGameWithEnterableNode,
  makeMockReq,
  makeMockRes,
  makeCapturingNext,
} from "../../testSupport/odysseyTestSupport.js";

describe("OdysseyMerchantController", () => {
  let userId: string;

  before(async () => {
    userId = await createTestUser("merchant-controller");
  });

  after(async () => {
    await deleteTestUser(userId);
  });

  test("test_openShop_returns404WhenTheSlotDoesNotExist", async () => {
    const req = makeMockReq({ userId, params: { slotId: "999", nodeId: "5" } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyMerchantController.openShop(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 404);
  });

  test("test_openShop_returnsAFiveItemCatalogAndThreeOfferings", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 1, ENodeType.Merchant);
    const req = makeMockReq({ userId, params: { slotId: "1", nodeId: String(node.id) } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyMerchantController.openShop(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    const data = (mock.body as any).data;
    assert.strictEqual(data.catalog.length, 5);
    assert.strictEqual(data.offerings.length, 3);
  });

  test("test_purchase_returns400ForAnInvalidItemPayload", async () => {
    await makeGameWithEnterableNode(userId, 2, ENodeType.Merchant);
    const req = makeMockReq({
      userId,
      params: { slotId: "2" },
      body: { item: { relicType: "not-a-relic", costPerCharge: 20 }, quantity: 1 },
    });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyMerchantController.purchase(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 400);
  });

  test("test_purchase_deductsCoinsAndGrantsTheRelic", async () => {
    const { node } = await makeGameWithEnterableNode(userId, 3, ENodeType.Merchant);
    const openReq = makeMockReq({ userId, params: { slotId: "3", nodeId: String(node.id) } });
    const openMock = makeMockRes();
    await OdysseyMerchantController.openShop(openReq, openMock.res, makeCapturingNext().next);
    const listing = (openMock.body as any).data.catalog[0];

    const req = makeMockReq({
      userId,
      params: { slotId: "3" },
      body: { item: { relicType: listing.relicType, costPerCharge: listing.costPerCharge }, quantity: 1 },
    });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyMerchantController.purchase(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    assert.ok((mock.body as any).data.game.relics.some((r: any) => r.type === listing.relicType));
  });

  test("test_sell_returns400ForAnInvalidRelicType", async () => {
    await makeGameWithEnterableNode(userId, 4, ENodeType.Merchant);
    const req = makeMockReq({ userId, params: { slotId: "4" }, body: { relicType: "not-a-relic" } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyMerchantController.sell(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 400);
  });

  test("test_sell_returnsFlatCoinsAndRemovesTheRelic", async () => {
    await makeGameWithEnterableNode(userId, 5, ENodeType.Merchant);
    const game = await OdysseyGameRepository.findBySlot(userId, 5);
    game!.relics = [OdysseyRelicFactory.create(ERelicType.Undo, 2)];
    await OdysseyGameRepository.upsert(game!);

    const req = makeMockReq({ userId, params: { slotId: "5" }, body: { relicType: ERelicType.Undo } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyMerchantController.sell(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 200);
    assert.strictEqual((mock.body as any).data.coinsGained, 25);
  });

  test("test_reroll_returns400WhenCatalogIsMissingOrEmpty", async () => {
    await makeGameWithEnterableNode(userId, 6, ENodeType.Merchant);
    const req = makeMockReq({ userId, params: { slotId: "6" }, body: { catalog: [] } });
    const mock = makeMockRes();
    const { next } = makeCapturingNext();

    await OdysseyMerchantController.reroll(req, mock.res, next);

    assert.strictEqual(mock.statusCode, 400);
  });
});
