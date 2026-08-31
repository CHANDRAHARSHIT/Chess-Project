import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyRestSite } from "../../models/OdysseyRestSite.js";
import { OdysseyRelicFactory } from "../../models/OdysseyRelicFactory.js";
import { MAX_RELIC_CHARGES } from "../../models/OdysseyRelic.js";
import { ERelicType } from "../../enums/ERelicType.js";
import { makeGame } from "../support/factories.js";

describe("OdysseyRestSite", () => {
  test("test_roll_distributesAtMostFivePoints", () => {
    const site = OdysseyRestSite.roll(makeGame());
    const total = Object.values(site.restores).reduce((sum, n) => sum + (n ?? 0), 0);
    assert.ok(total <= 5);
  });

  test("test_roll_neverPushesARelicsChargesAboveMax", () => {
    const game = makeGame({ relics: [OdysseyRelicFactory.create(ERelicType.Undo, 4)] });
    const site = OdysseyRestSite.roll(game);
    const undoRestored = site.restores[ERelicType.Undo] ?? 0;
    assert.ok(4 + undoRestored <= MAX_RELIC_CHARGES);
  });

  test("test_roll_forcesADiscoveryWhenEverythingIsAlreadyMaxed", () => {
    const game = makeGame({
      relics: Object.values(ERelicType).map(type => OdysseyRelicFactory.create(type, MAX_RELIC_CHARGES)),
    });
    const site = OdysseyRestSite.roll(game);
    assert.strictEqual(Object.keys(site.restores).length, 0);
    assert.ok(site.foundCoins !== null || site.foundRelic !== null);
  });

  test("test_roll_neverFindsAnAlreadyOwnedRelic", () => {
    const game = makeGame({ relics: [OdysseyRelicFactory.create(ERelicType.Undo, 0)] });
    for (let i = 0; i < 50; i++) {
      const site = OdysseyRestSite.roll(game);
      if (site.foundRelic !== null) {
        assert.notStrictEqual(site.foundRelic, ERelicType.Undo);
      }
    }
  });

  test("test_roll_coinRewardIsWithinFifteenToThirtyFiveRange", () => {
    for (let i = 0; i < 50; i++) {
      const site = OdysseyRestSite.roll(makeGame());
      if (site.foundCoins !== null) {
        assert.ok(site.foundCoins >= 15 && site.foundCoins <= 35);
      }
    }
  });

  test("test_applyTo_addsRestoredChargesToExistingRelic", () => {
    const game = makeGame({ relics: [OdysseyRelicFactory.create(ERelicType.Undo, 1)] });
    const site = new OdysseyRestSite();
    site.restores = { [ERelicType.Undo]: 2 };
    site.foundCoins = null;
    site.foundRelic = null;
    site.applyTo(game);
    assert.strictEqual(game.getRelic(ERelicType.Undo)!.charges, 3);
  });

  test("test_applyTo_grantsANewRelicWhenRestoringAnUnownedType", () => {
    const game = makeGame({ relics: [] });
    const site = new OdysseyRestSite();
    site.restores = { [ERelicType.Hint]: 2 };
    site.foundCoins = null;
    site.foundRelic = null;
    site.applyTo(game);
    assert.strictEqual(game.getRelic(ERelicType.Hint)!.charges, 2);
  });

  test("test_applyTo_addsFoundCoinsToGame", () => {
    const game = makeGame({ coins: 10 });
    const site = new OdysseyRestSite();
    site.restores = {};
    site.foundCoins = 20;
    site.foundRelic = null;
    site.applyTo(game);
    assert.strictEqual(game.coins, 30);
  });

  test("test_applyTo_grantsFoundRelicAtFullCharges", () => {
    const game = makeGame({ relics: [] });
    const site = new OdysseyRestSite();
    site.restores = {};
    site.foundCoins = null;
    site.foundRelic = ERelicType.EvalBar;
    site.applyTo(game);
    assert.strictEqual(game.getRelic(ERelicType.EvalBar)!.charges, MAX_RELIC_CHARGES);
  });

  test("test_applyTo_refillsFoundRelicToMaxWhenAlreadyOwned", () => {
    const game = makeGame({ relics: [OdysseyRelicFactory.create(ERelicType.EvalBar, 1)] });
    const site = new OdysseyRestSite();
    site.restores = {};
    site.foundCoins = null;
    site.foundRelic = ERelicType.EvalBar;
    site.applyTo(game);
    assert.strictEqual(game.getRelic(ERelicType.EvalBar)!.charges, MAX_RELIC_CHARGES);
  });
});
