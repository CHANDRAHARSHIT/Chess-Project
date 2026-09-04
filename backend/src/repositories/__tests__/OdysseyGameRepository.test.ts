import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { OdysseyGameRepository } from "../OdysseyGameRepository.js";
import { OdysseyGame } from "../../models/odyssey/models/OdysseyGame.js";
import { OdysseyMap } from "../../models/odyssey/models/OdysseyMap.js";
import { OdysseyPlayer } from "../../models/odyssey/models/OdysseyPlayer.js";
import { OdysseyRelicFactory } from "../../models/odyssey/models/OdysseyRelicFactory.js";
import { OdysseyBattleNode } from "../../models/odyssey/models/OdysseyBattleNode.js";
import { OdysseyBossNode } from "../../models/odyssey/models/OdysseyBossNode.js";
import { OdysseyPuzzleNode } from "../../models/odyssey/models/OdysseyPuzzleNode.js";
import { OdysseyNode } from "../../models/odyssey/models/OdysseyNode.js";
import { ERelicType } from "../../models/odyssey/enums/ERelicType.js";
import { EPlayerType } from "../../models/odyssey/enums/EPlayerType.js";
import { ENodeType } from "../../models/odyssey/enums/ENodeType.js";

/**
 * Integration tests — exercise the real Repository/database boundary
 * against the local Postgres instance (never production; DATABASE_URL in
 * this environment points at 127.0.0.1:54322, the local Supabase DB).
 * Each test run creates its own throwaway User row so tests never collide
 * with real data, and the `after` hook deletes it — the OdysseyGame
 * foreign key's ON DELETE CASCADE removes every save slot created during
 * the run along with it.
 */

let testUserId: string;

function makeUnsavedGame(slotId: number): OdysseyGame {
  const game = new OdysseyGame();
  game.userId = testUserId;
  game.slotId = slotId;
  game.player = null;
  game.map = OdysseyMap.generate(`repo-test-seed-${slotId}`);
  game.coins = 50;
  game.relics = [];
  game.completedNodes = [];
  game.currentNodeId = -1;
  game.journeyComplete = false;
  game.playtimeSeconds = 0;
  return game;
}

describe("OdysseyGameRepository", () => {
  before(async () => {
    const user = await prisma.user.create({
      data: { email: `odyssey-repo-test-${randomUUID()}@example.test` },
    });
    testUserId = user.id;
  });

  after(async () => {
    await prisma.user.delete({ where: { id: testUserId } });
  });

  test("test_findBySlot_returnsNullWhenNoRowExistsForTheSlot", async () => {
    const result = await OdysseyGameRepository.findBySlot(testUserId, 1);
    assert.strictEqual(result, null);
  });

  test("test_upsert_createsANewRowWhenNoneExistsForTheSlot", async () => {
    const game = makeUnsavedGame(1);
    const saved = await OdysseyGameRepository.upsert(game);
    assert.strictEqual(saved.userId, testUserId);
    assert.strictEqual(saved.slotId, 1);
    assert.ok(saved.id.length > 0);
  });

  test("test_upsert_updatesTheExistingRowForTheSameSlotInsteadOfCreatingASecondOne", async () => {
    const game = makeUnsavedGame(2);
    const first = await OdysseyGameRepository.upsert(game);

    game.coins = 999;
    const second = await OdysseyGameRepository.upsert(game);

    assert.strictEqual(second.id, first.id);
    assert.strictEqual(second.coins, 999);

    const all = await OdysseyGameRepository.findAllByUser(testUserId);
    assert.strictEqual(all.filter(g => g.slotId === 2).length, 1);
  });

  test("test_findBySlot_returnsAGameMatchingWhatWasSaved", async () => {
    const game = makeUnsavedGame(3);
    game.coins = 123;
    game.completedNodes = [0, 1, 2];
    game.currentNodeId = 2;
    game.journeyComplete = false;
    game.playtimeSeconds = 456;
    game.relics = [OdysseyRelicFactory.create(ERelicType.Undo, 3), OdysseyRelicFactory.create(ERelicType.Hint, 1)];

    await OdysseyGameRepository.upsert(game);
    const loaded = await OdysseyGameRepository.findBySlot(testUserId, 3);

    assert.ok(loaded);
    assert.strictEqual(loaded!.coins, 123);
    assert.deepStrictEqual(loaded!.completedNodes, [0, 1, 2]);
    assert.strictEqual(loaded!.currentNodeId, 2);
    assert.strictEqual(loaded!.playtimeSeconds, 456);
    assert.strictEqual(loaded!.relics.length, 2);
  });

  test("test_getModelUsingRow_reconstructsRelicsViaTheFactoryNotPlainObjects", async () => {
    const game = makeUnsavedGame(4);
    game.relics = [OdysseyRelicFactory.create(ERelicType.EvalBar, 2)];
    await OdysseyGameRepository.upsert(game);

    const loaded = await OdysseyGameRepository.findBySlot(testUserId, 4);
    const relic = loaded!.relics[0];
    assert.strictEqual(relic.type, ERelicType.EvalBar);
    assert.strictEqual(relic.charges, 2);
    assert.strictEqual(typeof relic.consume, "function"); // a real OdysseyRelic instance, not a plain {type, charges} object
  });

  test("test_getModelUsingRow_reconstructsEachNodeAsItsCorrectSubclass", async () => {
    const game = makeUnsavedGame(5);
    await OdysseyGameRepository.upsert(game);

    const loaded = await OdysseyGameRepository.findBySlot(testUserId, 5);
    const nodes = loaded!.map.nodes;

    const start = nodes.find(n => n.type === ENodeType.Start)!;
    assert.strictEqual(start.constructor.name, "OdysseyNode");

    const boss = nodes.find(n => n.type === ENodeType.Boss)!;
    assert.ok(boss instanceof OdysseyBossNode);

    const battle = nodes.find(n => n instanceof OdysseyBattleNode && !(n instanceof OdysseyBossNode));
    assert.ok(battle instanceof OdysseyBattleNode);
    assert.ok(typeof (battle as OdysseyBattleNode).difficulty === "number");
    assert.ok((battle as OdysseyBattleNode).monster !== undefined);

    const puzzle = nodes.find(n => n instanceof OdysseyPuzzleNode);
    assert.ok(puzzle instanceof OdysseyPuzzleNode);
  });

  test("test_getModelUsingRow_setsPlayerToNullWhenPlayerTypeColumnIsNull", async () => {
    const game = makeUnsavedGame(6);
    game.player = null;
    await OdysseyGameRepository.upsert(game);

    const loaded = await OdysseyGameRepository.findBySlot(testUserId, 6);
    assert.strictEqual(loaded!.player, null);
  });

  test("test_getModelUsingRow_reconstructsThePlayerFromThePlayerTypeColumn", async () => {
    const game = makeUnsavedGame(7);
    OdysseyPlayer.select(EPlayerType.Strategist, game);
    assert.ok(game.player); // sanity: selection actually succeeded before we persist it

    await OdysseyGameRepository.upsert(game);
    const loaded = await OdysseyGameRepository.findBySlot(testUserId, 7);

    assert.strictEqual(loaded!.player?.type, EPlayerType.Strategist);
    assert.strictEqual(loaded!.player?.maxHealth, 80); // reconstructed via getAvailable(), not a bare {type} stub
  });

  test("test_findAllByUser_returnsOnlyRowsBelongingToThatUser", async () => {
    const otherUser = await prisma.user.create({ data: { email: `odyssey-repo-test-other-${randomUUID()}@example.test` } });
    try {
      const otherGame = makeUnsavedGame(1);
      otherGame.userId = otherUser.id;
      await OdysseyGameRepository.upsert(otherGame);

      const mine = await OdysseyGameRepository.findAllByUser(testUserId);
      assert.ok(mine.every(g => g.userId === testUserId));
    } finally {
      await prisma.user.delete({ where: { id: otherUser.id } });
    }
  });

  test("test_delete_removesTheRowForThatSlot", async () => {
    const game = makeUnsavedGame(8);
    await OdysseyGameRepository.upsert(game);
    assert.ok(await OdysseyGameRepository.findBySlot(testUserId, 8));

    await OdysseyGameRepository.delete(testUserId, 8);

    assert.strictEqual(await OdysseyGameRepository.findBySlot(testUserId, 8), null);
  });

  test("test_delete_doesNotAffectOtherSlotsForTheSameUser", async () => {
    await OdysseyGameRepository.upsert(makeUnsavedGame(9));
    await OdysseyGameRepository.upsert(makeUnsavedGame(10));

    await OdysseyGameRepository.delete(testUserId, 9);

    assert.strictEqual(await OdysseyGameRepository.findBySlot(testUserId, 9), null);
    assert.ok(await OdysseyGameRepository.findBySlot(testUserId, 10));
  });

  test("test_delete_isANoOpWhenTheSlotDoesNotExist", async () => {
    await assert.doesNotReject(OdysseyGameRepository.delete(testUserId, 999));
  });
});
