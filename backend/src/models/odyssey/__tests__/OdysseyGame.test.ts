import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyRelicFactory } from "../models/OdysseyRelicFactory.js";
import { OdysseyPlayer } from "../models/OdysseyPlayer.js";
import { ERelicType } from "../enums/ERelicType.js";
import { EPlayerType } from "../enums/EPlayerType.js";
import { makeGame } from "./factories.js";

describe("OdysseyGame", () => {
  test("test_getRelic_returnsUndefinedWhenNotOwned", () => {
    const game = makeGame({ relics: [] });
    assert.strictEqual(game.getRelic(ERelicType.Undo), undefined);
  });

  test("test_ownsRelic_returnsTrueWhenPresent", () => {
    const game = makeGame({ relics: [OdysseyRelicFactory.create(ERelicType.Undo)] });
    assert.strictEqual(game.ownsRelic(ERelicType.Undo), true);
  });

  test("test_hasCharge_returnsFalseWhenRelicNotOwned", () => {
    const game = makeGame({ relics: [] });
    assert.strictEqual(game.hasCharge(ERelicType.Undo), false);
  });

  test("test_hasCharge_returnsTrueWhenOwnedRelicHasChargesRemaining", () => {
    const game = makeGame({ relics: [OdysseyRelicFactory.create(ERelicType.Undo, 1)] });
    assert.strictEqual(game.hasCharge(ERelicType.Undo), true);
  });

  test("test_hasFreeRelicSlot_returnsTrueBelowFiveRelics", () => {
    const game = makeGame({ relics: [] });
    assert.strictEqual(game.hasFreeRelicSlot(), true);
  });

  test("test_hasFreeRelicSlot_returnsFalseAtFiveRelics", () => {
    const game = makeGame({ relics: Object.values(ERelicType).map(type => OdysseyRelicFactory.create(type)) });
    assert.strictEqual(game.hasFreeRelicSlot(), false);
  });

  test("test_canAcquireRelic_returnsTrueWhenTypeAlreadyOwnedEvenWithNoFreeSlot", () => {
    const owned = OdysseyRelicFactory.create(ERelicType.Undo, 1);
    const game = makeGame({
      relics: [owned, ...Object.values(ERelicType).filter(type => type !== ERelicType.Undo).map(type => OdysseyRelicFactory.create(type))],
    });
    assert.strictEqual(game.hasFreeRelicSlot(), false);
    assert.strictEqual(game.canAcquireRelic(ERelicType.Undo), true);
  });

  test("test_canAcquireRelic_returnsTrueForUnownedTypeWhenAFreeSlotExists", () => {
    const game = makeGame({ relics: [] });
    assert.strictEqual(game.canAcquireRelic(ERelicType.Undo), true);
  });

  test("test_canAcquireRelic_returnsFalseForUnownedTypeWhenNoFreeSlotRemains", () => {
    const game = makeGame({ relics: Object.values(ERelicType).map(type => OdysseyRelicFactory.create(type)) });
    // every type is already owned in this fixture, so pick a type and remove it to simulate "unowned, slots full"
    game.relics = game.relics.slice(0, 5);
    game.removeRelic(ERelicType.Undo);
    game.relics.push(OdysseyRelicFactory.create(ERelicType.Hint)); // duplicate, artificial: refills the 5th slot without owning Undo
    assert.strictEqual(game.hasFreeRelicSlot(), false);
    assert.strictEqual(game.canAcquireRelic(ERelicType.Undo), false);
  });

  test("test_canAfford_returnsTrueWhenCoinsCoverAmount", () => {
    const game = makeGame({ coins: 100 });
    assert.strictEqual(game.canAfford(100), true);
  });

  test("test_canAfford_returnsFalseWhenCoinsAreInsufficient", () => {
    const game = makeGame({ coins: 99 });
    assert.strictEqual(game.canAfford(100), false);
  });

  test("test_addRelic_addsANewRelic", () => {
    const game = makeGame({ relics: [] });
    game.addRelic(OdysseyRelicFactory.create(ERelicType.Hint, 1));
    assert.strictEqual(game.ownsRelic(ERelicType.Hint), true);
  });

  test("test_addRelic_isANoOpWhenTypeAlreadyOwned", () => {
    const existing = OdysseyRelicFactory.create(ERelicType.Hint, 1);
    const game = makeGame({ relics: [existing] });
    game.addRelic(OdysseyRelicFactory.create(ERelicType.Hint, 5));
    assert.strictEqual(game.relics.length, 1);
    assert.strictEqual(game.getRelic(ERelicType.Hint), existing);
  });

  test("test_removeRelic_removesAnOwnedRelic", () => {
    const game = makeGame({ relics: [OdysseyRelicFactory.create(ERelicType.Time, 1)] });
    game.removeRelic(ERelicType.Time);
    assert.strictEqual(game.ownsRelic(ERelicType.Time), false);
  });

  test("test_addCoins_increasesCoinsByAmount", () => {
    const game = makeGame({ coins: 10 });
    game.addCoins(15);
    assert.strictEqual(game.coins, 25);
  });

  test("test_addCoins_neverDropsCoinsBelowZero", () => {
    const game = makeGame({ coins: 10 });
    game.addCoins(-50);
    assert.strictEqual(game.coins, 0);
  });

  test("test_canEnterNode_returnsTrueForAvailableNode", () => {
    const game = makeGame({ completedNodes: [], currentNodeId: -1 });
    assert.strictEqual(game.canEnterNode(0), true);
  });

  test("test_canEnterNode_returnsFalseForLockedNode", () => {
    const game = makeGame({ completedNodes: [], currentNodeId: -1 });
    const bossId = game.map.nodes[game.map.nodes.length - 1].id; // boss node, unreachable at game start
    assert.strictEqual(game.canEnterNode(bossId), false);
  });

  test("test_completeNode_addsNodeToCompletedNodes", () => {
    const game = makeGame({ completedNodes: [] });
    game.completeNode(3, false);
    assert.deepStrictEqual(game.completedNodes, [3]);
  });

  test("test_completeNode_isIdempotent", () => {
    const game = makeGame({ completedNodes: [3] });
    game.completeNode(3, false);
    assert.deepStrictEqual(game.completedNodes, [3]);
  });

  test("test_completeNode_setsJourneyCompleteWhenWasBossNodeIsTrue", () => {
    const game = makeGame({ journeyComplete: false });
    game.completeNode(50, true);
    assert.strictEqual(game.journeyComplete, true);
  });

  test("test_calculateProgressPercent_returns100WhenJourneyComplete", () => {
    const game = makeGame({ journeyComplete: true, completedNodes: [] });
    assert.strictEqual(game.calculateProgressPercent(), 100);
  });

  test("test_calculateProgressPercent_computesRoundedPercentageOfMaxPathLength", () => {
    const game = makeGame({ journeyComplete: false, completedNodes: [0, 1] }); // 2/16 = 12.5% -> 13
    assert.strictEqual(game.calculateProgressPercent(), 13);
  });

  test("test_reset_keepsCoinsRelicsAndPlayerWhenKeepProgressIsTrue", () => {
    const relic = OdysseyRelicFactory.create(ERelicType.Undo, 2);
    const player = new OdysseyPlayer(EPlayerType.Knight, "Knight", "desc", true);
    const game = makeGame({ coins: 200, relics: [relic], player, completedNodes: [0, 1] });
    game.reset(true);
    assert.strictEqual(game.coins, 200);
    assert.strictEqual(game.relics.length, 1);
    assert.strictEqual(game.player, player);
    assert.deepStrictEqual(game.completedNodes, []);
    assert.strictEqual(game.currentNodeId, -1);
    assert.strictEqual(game.journeyComplete, false);
  });

  test("test_reset_clearsCoinsRelicsAndPlayerWhenKeepProgressIsFalse", () => {
    const relic = OdysseyRelicFactory.create(ERelicType.Undo, 2);
    const player = new OdysseyPlayer(EPlayerType.Knight, "Knight", "desc", true);
    const game = makeGame({ coins: 200, relics: [relic], player });
    game.reset(false);
    assert.strictEqual(game.coins, 50);
    assert.strictEqual(game.relics.length, 0);
    assert.strictEqual(game.player, null);
  });

  test("test_reset_regeneratesTheMap", () => {
    const game = makeGame();
    const oldMap = game.map;
    game.reset(true);
    assert.notStrictEqual(game.map, oldMap);
  });
});
