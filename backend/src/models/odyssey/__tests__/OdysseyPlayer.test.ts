import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { OdysseyPlayer } from "../models/OdysseyPlayer.js";
import { EPlayerType } from "../enums/EPlayerType.js";
import { makeGame } from "./factories.js";

describe("OdysseyPlayer", () => {
  test("test_canBeSelected_returnsTrueWhenUnlocked", () => {
    const player = new OdysseyPlayer(EPlayerType.Knight, "Knight", "desc", true);
    assert.strictEqual(player.canBeSelected(), true);
  });

  test("test_canBeSelected_returnsFalseWhenLocked", () => {
    const player = new OdysseyPlayer(EPlayerType.Rook, "Rook", "desc", false);
    assert.strictEqual(player.canBeSelected(), false);
  });

  test("test_getAvailable_returnsStrategistAlwaysUnlocked", () => {
    const roster = OdysseyPlayer.getAvailable(makeGame());
    assert.strictEqual(roster.find(p => p.type === EPlayerType.Strategist)!.unlocked, true);
  });

  test("test_getAvailable_returnsStrategistWithHealthGoldAndAbility", () => {
    const roster = OdysseyPlayer.getAvailable(makeGame());
    const strategist = roster.find(p => p.type === EPlayerType.Strategist)!;
    assert.strictEqual(strategist.maxHealth, 80);
    assert.strictEqual(strategist.gold, 99);
    assert.strictEqual(strategist.ability?.name, "Calculated Mind");
  });

  test("test_getAvailable_returnsKnightAlwaysUnlocked", () => {
    const roster = OdysseyPlayer.getAvailable(makeGame());
    assert.strictEqual(roster.find(p => p.type === EPlayerType.Knight)!.unlocked, true);
  });

  test("test_getAvailable_returnsKnightWithNoStatsDefined", () => {
    const roster = OdysseyPlayer.getAvailable(makeGame());
    const knight = roster.find(p => p.type === EPlayerType.Knight)!;
    assert.strictEqual(knight.maxHealth, undefined);
    assert.strictEqual(knight.gold, undefined);
    assert.strictEqual(knight.ability, undefined);
  });

  test("test_getAvailable_returnsBishopLockedBeforeTenCompletedNodes", () => {
    const game = makeGame({ completedNodes: [0, 1, 2] });
    const roster = OdysseyPlayer.getAvailable(game);
    assert.strictEqual(roster.find(p => p.type === EPlayerType.Bishop)!.unlocked, false);
  });

  test("test_getAvailable_returnsBishopUnlockedAtTenCompletedNodes", () => {
    const game = makeGame({ completedNodes: Array.from({ length: 10 }, (_, i) => i) });
    const roster = OdysseyPlayer.getAvailable(game);
    assert.strictEqual(roster.find(p => p.type === EPlayerType.Bishop)!.unlocked, true);
  });

  test("test_getAvailable_returnsRookLockedBeforeJourneyComplete", () => {
    const game = makeGame({ journeyComplete: false });
    const roster = OdysseyPlayer.getAvailable(game);
    assert.strictEqual(roster.find(p => p.type === EPlayerType.Rook)!.unlocked, false);
  });

  test("test_getAvailable_returnsRookUnlockedWhenJourneyComplete", () => {
    const game = makeGame({ journeyComplete: true });
    const roster = OdysseyPlayer.getAvailable(game);
    assert.strictEqual(roster.find(p => p.type === EPlayerType.Rook)!.unlocked, true);
  });

  test("test_getAvailable_returnsAllFourPlayerTypes", () => {
    const roster = OdysseyPlayer.getAvailable(makeGame());
    assert.strictEqual(roster.length, 4);
    assert.deepStrictEqual(
      roster.map(p => p.type).sort(),
      [EPlayerType.Bishop, EPlayerType.Knight, EPlayerType.Rook, EPlayerType.Strategist].sort()
    );
  });

  test("test_select_setsGamePlayerWhenTypeIsUnlocked", () => {
    const game = makeGame({ player: null });
    OdysseyPlayer.select(EPlayerType.Knight, game);
    assert.strictEqual(game.player?.type, EPlayerType.Knight);
  });

  test("test_select_setsGamePlayerForStrategistByDefault", () => {
    const game = makeGame({ player: null });
    OdysseyPlayer.select(EPlayerType.Strategist, game);
    assert.strictEqual(game.player?.type, EPlayerType.Strategist);
  });

  test("test_select_doesNotSetGamePlayerWhenTypeIsLocked", () => {
    const game = makeGame({ player: null, journeyComplete: false });
    OdysseyPlayer.select(EPlayerType.Rook, game);
    assert.strictEqual(game.player, null);
  });

  test("test_select_doesNotSetGamePlayerForAnUnknownType", () => {
    const game = makeGame({ player: null });
    OdysseyPlayer.select("nonexistent" as EPlayerType, game);
    assert.strictEqual(game.player, null);
  });
});
