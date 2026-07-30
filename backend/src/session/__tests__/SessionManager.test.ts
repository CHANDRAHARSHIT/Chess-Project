import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { SessionManager } from "../SessionManager.js";
import type { MatchDescriptor, GameResult } from "../../contracts/index.js";
import { Chess960Variant } from "../../variant/index.js";

function createDummyDescriptor(): MatchDescriptor {
  return {
    matchId: "match-uuid-123",
    participants: [
      { userId: "user-w", side: 0 },
      { userId: "user-b", side: 1 },
    ],
    cardinality: { sides: 2, perSide: 1 },
    variantId: "chess960",
    variantParams: { positionId: 518 }, // Standard position
    timeControl: { initialSeconds: 300, incrementSeconds: 3, label: "5+3 Blitz" },
    rated: false,
    provenance: "queue",
    createdAt: new Date().toISOString(),
  };
}

describe("SessionManager State Machine & Clock Authority", () => {
  test("createSession produces session in WAITING with stopped clocks", () => {
    let resultEmitted: GameResult | null = null;
    const sm = new SessionManager((res) => {
      resultEmitted = res;
    });

    const descriptor = createDummyDescriptor();
    const session = sm.createSession(descriptor);

    assert.equal(session.status, "WAITING");
    assert.equal(session.clock.lastMoveAt, null);
    assert.equal(session.clock.remainingMs[0], 300000);
    assert.equal(session.clock.remainingMs[1], 300000);
    assert.equal(session.resultEmitted, false);
    assert.equal(resultEmitted, null);
  });

  test("notifyAllPresent transitions WAITING -> READY (idempotently)", () => {
    const sm = new SessionManager();
    const session = sm.createSession(createDummyDescriptor());

    sm.notifyAllPresent(session.sessionId);
    assert.equal(session.status, "READY");
    assert.equal(session.clock.lastMoveAt, null);

    // Second call is idempotent no-op
    sm.notifyAllPresent(session.sessionId);
    assert.equal(session.status, "READY");
  });

  test("submitMove in WAITING is rejected", () => {
    const sm = new SessionManager();
    const session = sm.createSession(createDummyDescriptor());

    const moveRes = sm.submitMove(session.sessionId, "user-w", { from: "e2", to: "e4" });
    assert.equal(moveRes.legal, false);
    assert.equal(session.status, "WAITING");
  });

  test("first submitMove in READY transitions to PLAYING and starts clock", () => {
    const sm = new SessionManager();
    const session = sm.createSession(createDummyDescriptor());
    sm.notifyAllPresent(session.sessionId);

    const moveRes = sm.submitMove(session.sessionId, "user-w", { from: "e2", to: "e4" });
    assert.equal(moveRes.legal, true);
    assert.equal(session.status, "PLAYING");
    assert.notEqual(session.clock.lastMoveAt, null);
    assert.equal(session.moveHistory.length, 1);
  });

  test("submitMove enforces turn order and legal moves", () => {
    const sm = new SessionManager();
    const session = sm.createSession(createDummyDescriptor());
    sm.notifyAllPresent(session.sessionId);

    // First move: White moves e2-e4
    sm.submitMove(session.sessionId, "user-w", { from: "e2", to: "e4" });

    // White tries to move again out of turn
    const outOfTurn = sm.submitMove(session.sessionId, "user-w", { from: "d2", to: "d4" });
    assert.equal(outOfTurn.legal, false);

    // Non-participant tries to move
    const nonPart = sm.submitMove(session.sessionId, "stranger", { from: "e7", to: "e5" });
    assert.equal(nonPart.legal, false);

    // Black makes illegal move
    const illegalMove = sm.submitMove(session.sessionId, "user-b", { from: "e7", to: "e2" });
    assert.equal(illegalMove.legal, false);

    // Black makes legal move e7-e5
    const legalBlack = sm.submitMove(session.sessionId, "user-b", { from: "e7", to: "e5" });
    assert.equal(legalBlack.legal, true);
    assert.equal(session.moveHistory.length, 2);
  });

  test("forfeit transitions to ABANDONED and emits GameResult exactly once", () => {
    const emittedResults: GameResult[] = [];
    const sm = new SessionManager((res) => {
      emittedResults.push(res);
    });

    const session = sm.createSession(createDummyDescriptor());
    sm.notifyAllPresent(session.sessionId);

    // Forfeit by user-b (Black) -> White wins
    sm.forfeit(session.sessionId, "user-b");

    assert.equal(session.status, "ABANDONED");
    assert.equal(emittedResults.length, 1);
    assert.equal(emittedResults[0].terminationReason, "forfeit");
    assert.equal(emittedResults[0].outcome.kind, "win");
    if (emittedResults[0].outcome.kind === "win") {
      assert.equal(emittedResults[0].outcome.winningSide, 0); // White won
    }

    // Second forfeit or move attempt is no-op
    sm.forfeit(session.sessionId, "user-w");
    assert.equal(emittedResults.length, 1); // No second result
  });

  test("tickClocks is no-op in WAITING/READY, ticks in PLAYING, triggers timeout", () => {
    const emittedResults: GameResult[] = [];
    const sm = new SessionManager((res) => {
      emittedResults.push(res);
    });

    const session = sm.createSession(createDummyDescriptor());

    // Tick in WAITING -> no-op
    sm.tickClocks(10000);
    assert.equal(session.clock.remainingMs[0], 300000);

    sm.notifyAllPresent(session.sessionId);

    // Tick in READY -> no-op
    sm.tickClocks(10000);
    assert.equal(session.clock.remainingMs[0], 300000);

    // White plays e2-e4 -> enters PLAYING
    sm.submitMove(session.sessionId, "user-w", { from: "e2", to: "e4" });
    assert.equal(session.status, "PLAYING");

    // It is now Black's turn (side 1)
    // Tick 10 seconds -> Black's clock decrements
    sm.tickClocks(10000);
    assert.equal(session.clock.remainingMs[1], 290000);

    // Tick 300 seconds -> Black's clock exhausts -> timeout
    sm.tickClocks(300000);
    assert.equal(session.status, "COMPLETED");
    assert.equal(session.clock.remainingMs[1], 0);
    assert.equal(emittedResults.length, 1);
    assert.equal(emittedResults[0].terminationReason, "timeout");
    if (emittedResults[0].outcome.kind === "win") {
      assert.equal(emittedResults[0].outcome.winningSide, 0); // White won by timeout
    }

    // Additional tick after COMPLETED does not emit a second result
    sm.tickClocks(10000);
    assert.equal(emittedResults.length, 1);
  });
});
