import crypto from "crypto";
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { attachBot, acquireBot, releaseBot, maybePlayBotTurn } from "../botPlayer.js";
import { prisma } from "../../config/prisma.js";
import { SessionManager, wireMatchmakingSessionBridge } from "../../session/index.js";
import { matchmakingQueue } from "../../matchmaking/index.js";
import type {
  MatchDescriptor,
  VariantContract,
  Move,
  GameResult,
  ParticipantAssignment,
} from "../../contracts/index.js";

const BOT_EMAILS = [
  "bot1@xlchess.internal",
  "bot2@xlchess.internal",
  "bot3@xlchess.internal",
  "bot4@xlchess.internal",
  "bot5@xlchess.internal",
];

function fakeBotUsers() {
  return BOT_EMAILS.map((email, i) => ({ id: `bot-user-${i + 1}`, name: `XLChess Bot ${i + 1}`, image: null }));
}

/**
 * node:test's t.mock.method() cannot patch prisma.user.findMany (Prisma's model delegate
 * doesn't expose it the way mock.method's internals expect) — patch and restore the property
 * directly instead. No live database call is ever made; only the mocked stub is invoked.
 */
function mockFindMany(rows: unknown[]): () => void {
  const original = prisma.user.findMany;
  (prisma.user as unknown as { findMany: unknown }).findMany = async () => rows;
  return () => {
    (prisma.user as unknown as { findMany: unknown }).findMany = original;
  };
}

const FAKE_MOVE: Move = { from: "a2", to: "a3" };

/** Deterministic single-legal-move variant so bot moves are assertable exactly. */
function createFakeVariant(): VariantContract {
  return {
    variantId: "fake-chess",
    getCardinality: () => ({ sides: 2, perSide: 1, turnOrder: [0, 1] }),
    initialState: () => ({}),
    validateMove: () => ({ legal: true }),
    applyMove: (state) => ({ ...state }),
    isTerminal: () => false,
    getOutcome: () => ({ kind: "draw", reason: "n/a" }),
    legalMoves: () => [FAKE_MOVE],
  };
}

function createHumanOnlyDescriptor(): MatchDescriptor {
  return {
    matchId: crypto.randomUUID(),
    participants: [
      { userId: "human-only-a", side: 0 },
      { userId: "human-only-b", side: 1 },
    ],
    cardinality: { sides: 2, perSide: 1 },
    variantId: "fake-chess",
    variantParams: {},
    timeControl: { initialSeconds: 300, incrementSeconds: 3, label: "5+3 Blitz" },
    rated: false,
    provenance: "queue",
    createdAt: new Date().toISOString(),
  };
}

describe("botPlayer (M7 bot fallback)", () => {
  const emittedResults: GameResult[] = [];
  const sharedSessionManager = new SessionManager(
    (result) => emittedResults.push(result),
    (variantId) => (variantId === "fake-chess" ? createFakeVariant() : undefined),
    undefined,
    { matchStartGraceMs: 0 }
  );

  // Registered once, before attachBot() registers its own listener below — mirrors index.ts's
  // required composition order (session-creation listener before the bot presence listener).
  wireMatchmakingSessionBridge(matchmakingQueue, sharedSessionManager);

  /**
   * Forms one bot match via the real queue + listener flow and returns it only once the bot
   * landed on `wantBotSide` (side assignment is randomized inside matchStaleTicketWithBot and
   * not otherwise controllable). Wrong-side attempts release the bot and retry with a fresh
   * ticket; bounded well above what 50/50 odds should ever need.
   */
  function formBotMatch(wantBotSide: 0 | 1): { sessionId: string; botUserId: string; humanUserId: string } {
    for (let attempt = 0; attempt < 50; attempt++) {
      const bot = acquireBot();
      assert.notEqual(bot, null, "expected an available bot in the pool");

      const humanUserId = `human-${crypto.randomUUID()}`;
      matchmakingQueue.enqueue(humanUserId, "fake-chess");
      const descriptor = matchmakingQueue.matchStaleTicketWithBot(bot!, 0);
      assert.notEqual(descriptor, null, "expected a bot descriptor to form");

      const botParticipant = descriptor!.participants.find((p) => p.userId === bot!.userId)!;
      const sessionId = sharedSessionManager.getSessionIdForParticipant(bot!.userId)!;

      if (botParticipant.side === wantBotSide) {
        return { sessionId, botUserId: bot!.userId, humanUserId };
      }

      // Wrong side — abandon this orphaned session immediately so its real 60s WAITING
      // no-show timer doesn't linger and keep the process alive until it eventually fires.
      sharedSessionManager.forfeit(sessionId, humanUserId);
      releaseBot(bot!.userId);
    }
    throw new Error(`could not form a bot match with side ${wantBotSide} after 50 attempts`);
  }

  describe("attachBot() roster loading", () => {
    test("returns false and does not attach for an incomplete roster", async () => {
      const restore = mockFindMany(fakeBotUsers().slice(0, 4));
      try {
        const attached = await attachBot(sharedSessionManager);
        assert.equal(attached, false);
      } finally {
        restore();
      }
    });

    test("returns true and caches all five bots for a complete roster", async () => {
      const restore = mockFindMany(fakeBotUsers());
      try {
        const attached = await attachBot(sharedSessionManager);
        assert.equal(attached, true);
      } finally {
        restore();
      }
    });
  });

  describe("acquireBot() / releaseBot() pool semantics", () => {
    test("acquireBot() allocates each bot exactly once; the pool then reports exhausted", () => {
      const acquired: ParticipantAssignment[] = [];
      for (let i = 0; i < 5; i++) {
        const bot = acquireBot();
        assert.notEqual(bot, null);
        acquired.push(bot!);
      }
      assert.equal(new Set(acquired.map((b) => b.userId)).size, 5);
      assert.equal(acquireBot(), null);

      for (const bot of acquired) releaseBot(bot.userId);
    });

    test("releaseBot() returns a bot to the pool; human/unknown IDs are safe no-ops", () => {
      assert.doesNotThrow(() => releaseBot("human-user-abc"));
      assert.doesNotThrow(() => releaseBot("totally-unknown-id"));

      const acquired: ParticipantAssignment[] = [];
      for (let i = 0; i < 5; i++) {
        const bot = acquireBot();
        assert.notEqual(bot, null);
        acquired.push(bot!);
      }
      for (const bot of acquired) releaseBot(bot.userId);

      // The pool is fully available again after release.
      const reacquired: ParticipantAssignment[] = [];
      for (let i = 0; i < 5; i++) {
        const bot = acquireBot();
        assert.notEqual(bot, null);
        reacquired.push(bot!);
      }
      for (const bot of reacquired) releaseBot(bot.userId);
    });
  });

  describe("maybePlayBotTurn() gameplay", () => {
    test("human-only sessions never schedule a bot move", (t) => {
      const session = sharedSessionManager.createSession(createHumanOnlyDescriptor());
      sharedSessionManager.notifyParticipantConnected(session.sessionId, "human-only-a");
      sharedSessionManager.notifyParticipantConnected(session.sessionId, "human-only-b");
      assert.equal(session.status, "READY");

      t.mock.timers.enable({ apis: ["setTimeout"] });
      maybePlayBotTurn(sharedSessionManager, session.sessionId);
      t.mock.timers.tick(5000);

      assert.equal(session.moveHistory.length, 0);
    });

    test("a bot assigned the first side makes exactly one legal move after the delay", (t) => {
      const { sessionId, botUserId, humanUserId } = formBotMatch(0);
      sharedSessionManager.notifyParticipantConnected(sessionId, humanUserId);
      const session = sharedSessionManager.getSession(sessionId)!;
      assert.equal(session.status, "READY");

      t.mock.timers.enable({ apis: ["setTimeout"] });
      maybePlayBotTurn(sharedSessionManager, sessionId);
      t.mock.timers.tick(2000);

      assert.equal(session.moveHistory.length, 1);
      assert.deepEqual(session.moveHistory[0], FAKE_MOVE);

      // No further move fires without another maybePlayBotTurn() call.
      t.mock.timers.tick(5000);
      assert.equal(session.moveHistory.length, 1);

      releaseBot(botUserId);
    });

    test("after a legal human move, the bot makes exactly one reply; a rejected human move triggers none", (t) => {
      const { sessionId, botUserId, humanUserId } = formBotMatch(1);
      sharedSessionManager.notifyParticipantConnected(sessionId, humanUserId);
      const session = sharedSessionManager.getSession(sessionId)!;
      assert.equal(session.status, "READY");

      const accepted = sharedSessionManager.submitMove(sessionId, humanUserId, FAKE_MOVE);
      assert.equal(accepted.legal, true);
      assert.equal(session.moveHistory.length, 1);

      // It's the bot's turn now — the human immediately resubmitting is out of turn and rejected.
      const rejected = sharedSessionManager.submitMove(sessionId, humanUserId, FAKE_MOVE);
      assert.equal(rejected.legal, false);
      assert.equal(session.moveHistory.length, 1); // unchanged by the rejection

      // The bridge calls maybePlayBotTurn() only after the accepted move, never after a rejection.
      t.mock.timers.enable({ apis: ["setTimeout"] });
      maybePlayBotTurn(sharedSessionManager, sessionId);
      t.mock.timers.tick(2000);

      assert.equal(session.moveHistory.length, 2); // exactly one bot reply
      assert.deepEqual(session.moveHistory[1], FAKE_MOVE);

      releaseBot(botUserId);
    });

    test("a terminal or changed-turn session during the delay submits no move", (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });

      // Terminal: schedule a bot reply, then end the game before the timer fires.
      const terminalCase = formBotMatch(1);
      sharedSessionManager.notifyParticipantConnected(terminalCase.sessionId, terminalCase.humanUserId);
      sharedSessionManager.submitMove(terminalCase.sessionId, terminalCase.humanUserId, FAKE_MOVE);
      maybePlayBotTurn(sharedSessionManager, terminalCase.sessionId);
      const terminalSession = sharedSessionManager.getSession(terminalCase.sessionId)!;
      sharedSessionManager.forfeit(terminalCase.sessionId, terminalCase.humanUserId);
      assert.equal(terminalSession.status, "ABANDONED");

      // Changed-turn: schedule a bot reply, then advance the turn out from under it before it fires.
      const changedTurnCase = formBotMatch(1);
      sharedSessionManager.notifyParticipantConnected(changedTurnCase.sessionId, changedTurnCase.humanUserId);
      sharedSessionManager.submitMove(changedTurnCase.sessionId, changedTurnCase.humanUserId, FAKE_MOVE);
      maybePlayBotTurn(sharedSessionManager, changedTurnCase.sessionId);
      const changedTurnSession = sharedSessionManager.getSession(changedTurnCase.sessionId)!;
      // moveHistory is Session's own plain (non-private) bookkeeping — directly extending it here
      // stands in for "some other event advanced the game" before the stale callback fires. One
      // extra move flips parity so it's side 0's (human's) turn again, not the pending bot's.
      (changedTurnSession as unknown as { moveHistory: Move[] }).moveHistory = [
        ...changedTurnSession.moveHistory,
        FAKE_MOVE,
      ];

      t.mock.timers.tick(2000);

      assert.equal(terminalSession.moveHistory.length, 1); // only the human's move landed
      assert.equal(changedTurnSession.moveHistory.length, 2); // unchanged by the stale callback

      releaseBot(terminalCase.botUserId);
      releaseBot(changedTurnCase.botUserId);
    });
  });

  describe("bot-match listener", () => {
    test("marks the bot present only after session creation succeeds", () => {
      const bot = acquireBot();
      assert.notEqual(bot, null);

      const humanUserId = `human-${crypto.randomUUID()}`;
      matchmakingQueue.enqueue(humanUserId, "fake-chess");
      const descriptor = matchmakingQueue.matchStaleTicketWithBot(bot!, 0);
      assert.notEqual(descriptor, null);

      const sessionId = sharedSessionManager.getSessionIdForParticipant(bot!.userId);
      assert.notEqual(sessionId, undefined);

      const session = sharedSessionManager.getSession(sessionId!)!;
      assert.equal(session.status, "WAITING"); // only the bot is present so far

      // Reaching READY here requires both participants present — proves the listener already
      // registered the bot as connected before the human did.
      sharedSessionManager.notifyParticipantConnected(sessionId!, humanUserId);
      assert.equal(session.status, "READY");

      sharedSessionManager.forfeit(sessionId!, humanUserId);
      releaseBot(bot!.userId);
    });

    test("failed session creation releases the acquired bot", () => {
      const bot = acquireBot();
      assert.notEqual(bot, null);

      const humanUserId = `human-${crypto.randomUUID()}`;
      const { ticket } = matchmakingQueue.enqueue(humanUserId, "unregistered-variant");
      const descriptor = matchmakingQueue.matchStaleTicketWithBot(bot!, 0);
      assert.notEqual(descriptor, null);

      // No variant resolves "unregistered-variant" — session creation throws and no session exists.
      assert.equal(sharedSessionManager.getSessionIdForParticipant(bot!.userId), undefined);

      // The listener released it without any test-side cleanup — the full pool is acquirable.
      const reacquired: ParticipantAssignment[] = [];
      for (let i = 0; i < 5; i++) {
        const b = acquireBot();
        assert.notEqual(b, null);
        reacquired.push(b!);
      }
      assert.ok(reacquired.some((b) => b.userId === bot!.userId));
      for (const b of reacquired) releaseBot(b.userId);

      // compensateFailedMatch() refunded the human ticket back to WAITING — cancel it so it
      // doesn't linger as the globally-oldest ticket and get picked up by a later test's
      // matchStaleTicketWithBot() call (which always selects the oldest WAITING ticket).
      matchmakingQueue.cancel(ticket.ticketId, humanUserId);
    });
  });

  describe("result cleanup", () => {
    test("releases the bot and clears any pending timer", (t) => {
      const { sessionId, botUserId, humanUserId } = formBotMatch(1);
      sharedSessionManager.notifyParticipantConnected(sessionId, humanUserId);
      sharedSessionManager.submitMove(sessionId, humanUserId, FAKE_MOVE);

      t.mock.timers.enable({ apis: ["setTimeout"] });
      maybePlayBotTurn(sharedSessionManager, sessionId); // schedules the bot's delayed reply

      // Simulates index.ts's onResult wrapper: release the bot for every terminal-result
      // participant before the delayed callback would otherwise fire.
      releaseBot(botUserId);

      t.mock.timers.tick(2000);

      const session = sharedSessionManager.getSession(sessionId)!;
      assert.equal(session.moveHistory.length, 1); // the cleared timer never fired

      const reacquired = acquireBot();
      assert.notEqual(reacquired, null); // available again, not stuck busy
      releaseBot(reacquired!.userId);
    });
  });
});
