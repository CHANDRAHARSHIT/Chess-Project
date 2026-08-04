import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { SessionManager } from "../SessionManager.js";
import type { MatchDescriptor, GameResult } from "../../contracts/index.js";

function createDummyDescriptor(): MatchDescriptor {
  return {
    matchId: "match-uuid-456",
    participants: [
      { userId: "user-w", side: 0 },
      { userId: "user-b", side: 1 },
    ],
    cardinality: { sides: 2, perSide: 1 },
    variantId: "chess960",
    variantParams: { positionId: 518 },
    timeControl: { initialSeconds: 300, incrementSeconds: 3, label: "5+3 Blitz" },
    rated: false,
    provenance: "queue",
    createdAt: new Date().toISOString(),
  };
}

// Short overridden timings so these tests don't wait on real 30-60s durations (M1-AM-01 / M2 additions).
const FAST_TIMINGS = { participantGraceMs: 40, pauseGraceMs: 40, waitTimeoutMs: 40 };

/** Minimal SessionTransport double that records every broadcast() call (AM-03). */
function createRecordingTransport() {
  const broadcasts: { userIds: string[]; message: { type: string; payload: unknown } }[] = [];
  return {
    transport: {
      send: () => {},
      broadcast: (userIds: string[], message: { type: string; payload: unknown }) => {
        broadcasts.push({ userIds, message });
      },
      isConnected: () => false,
    },
    broadcasts,
  };
}

describe("SessionManager M2: presence, grace timers, PAUSED (M1-AM-01)", () => {
  test("getSessionIdForParticipant resolves both participants after createSession", () => {
    const sm = new SessionManager(undefined, undefined, undefined, FAST_TIMINGS);
    const session = sm.createSession(createDummyDescriptor());

    assert.equal(sm.getSessionIdForParticipant("user-w"), session.sessionId);
    assert.equal(sm.getSessionIdForParticipant("user-b"), session.sessionId);
    assert.equal(sm.getSessionIdForParticipant("stranger"), undefined);
  });

  test("notifyParticipantConnected transitions WAITING -> READY only once both are present", () => {
    const sm = new SessionManager(undefined, undefined, undefined, FAST_TIMINGS);
    const session = sm.createSession(createDummyDescriptor());

    sm.notifyParticipantConnected(session.sessionId, "user-w");
    assert.equal(session.status, "WAITING");

    sm.notifyParticipantConnected(session.sessionId, "user-b");
    assert.equal(session.status, "READY");
  });

  test("WAITING no-show times out to ABANDONED with no GameResult emitted", async () => {
    const emitted: GameResult[] = [];
    const sm = new SessionManager((r) => emitted.push(r), undefined, undefined, FAST_TIMINGS);
    const session = sm.createSession(createDummyDescriptor());

    await new Promise((resolve) => setTimeout(resolve, 60));

    assert.equal(session.status, "ABANDONED");
    assert.equal(emitted.length, 0);
  });

  test("one participant disconnecting during PLAYING starts grace -> forfeit via existing path", async () => {
    const emitted: GameResult[] = [];
    const sm = new SessionManager((r) => emitted.push(r), undefined, undefined, FAST_TIMINGS);
    const session = sm.createSession(createDummyDescriptor());

    sm.notifyParticipantConnected(session.sessionId, "user-w");
    sm.notifyParticipantConnected(session.sessionId, "user-b");
    sm.submitMove(session.sessionId, "user-w", { from: "e2", to: "e4" });
    assert.equal(session.status, "PLAYING");

    sm.notifyParticipantDisconnected(session.sessionId, "user-b");
    // user-w is still connected -> per-participant grace for user-b, not PAUSED
    assert.equal(session.status, "PLAYING");

    await new Promise((resolve) => setTimeout(resolve, 60));

    assert.equal(session.status, "ABANDONED");
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].terminationReason, "forfeit");
    assert.deepEqual(emitted[0].outcome, { kind: "win", winningSide: 0 });
  });

  test("reconnect within grace clears the timer and PLAYING continues", async () => {
    const emitted: GameResult[] = [];
    const sm = new SessionManager((r) => emitted.push(r), undefined, undefined, FAST_TIMINGS);
    const session = sm.createSession(createDummyDescriptor());

    sm.notifyParticipantConnected(session.sessionId, "user-w");
    sm.notifyParticipantConnected(session.sessionId, "user-b");
    sm.submitMove(session.sessionId, "user-w", { from: "e2", to: "e4" });

    sm.notifyParticipantDisconnected(session.sessionId, "user-b");
    sm.notifyParticipantConnected(session.sessionId, "user-b"); // reconnect before grace expires

    await new Promise((resolve) => setTimeout(resolve, 60));

    assert.equal(session.status, "PLAYING");
    assert.equal(emitted.length, 0);
  });

  test("both participants disconnecting during PLAYING enters PAUSED, then resumes on reconnect", () => {
    const sm = new SessionManager(undefined, undefined, undefined, FAST_TIMINGS);
    const session = sm.createSession(createDummyDescriptor());

    sm.notifyParticipantConnected(session.sessionId, "user-w");
    sm.notifyParticipantConnected(session.sessionId, "user-b");
    sm.submitMove(session.sessionId, "user-w", { from: "e2", to: "e4" });

    sm.notifyParticipantDisconnected(session.sessionId, "user-b");
    sm.notifyParticipantDisconnected(session.sessionId, "user-w");
    assert.equal(session.status, "PAUSED");

    sm.notifyParticipantConnected(session.sessionId, "user-w");
    assert.equal(session.status, "PLAYING");
  });

  test("AM-03 (Backend Stabilization, pre-M5): connect/disconnect broadcast minimal presence_update facts", () => {
    const { transport, broadcasts } = createRecordingTransport();
    const sm = new SessionManager(undefined, undefined, transport, FAST_TIMINGS);
    const session = sm.createSession(createDummyDescriptor());

    sm.notifyParticipantConnected(session.sessionId, "user-w");

    const connectMsg = broadcasts.find(
      (b) => b.message.type === "presence_update" && (b.message.payload as any).userId === "user-w"
    );
    assert.ok(connectMsg, "expected a presence_update broadcast for user-w connecting");
    assert.deepEqual(connectMsg!.message.payload, { userId: "user-w", connected: true });
    // Broadcast reaches all participants (Session's existing broadcast pattern), not just the mover.
    assert.deepEqual([...connectMsg!.userIds].sort(), ["user-b", "user-w"]);

    sm.notifyParticipantConnected(session.sessionId, "user-b"); // WAITING -> READY
    sm.submitMove(session.sessionId, "user-w", { from: "e2", to: "e4" }); // READY -> PLAYING

    sm.notifyParticipantDisconnected(session.sessionId, "user-b");

    const disconnectMsg = broadcasts.find(
      (b) =>
        b.message.type === "presence_update" &&
        (b.message.payload as any).userId === "user-b" &&
        (b.message.payload as any).connected === false
    );
    assert.ok(disconnectMsg, "expected a presence_update broadcast for user-b disconnecting");
    assert.deepEqual(disconnectMsg!.message.payload, { userId: "user-b", connected: false });

    // Payload is minimal: exactly userId + connected, nothing else of Session's internal state.
    assert.deepEqual(Object.keys(disconnectMsg!.message.payload as object).sort(), ["connected", "userId"]);
  });

  test("PAUSED with nobody reconnecting expires to ABANDONED with a mutual-draw GameResult", async () => {
    const emitted: GameResult[] = [];
    const sm = new SessionManager((r) => emitted.push(r), undefined, undefined, FAST_TIMINGS);
    const session = sm.createSession(createDummyDescriptor());

    sm.notifyParticipantConnected(session.sessionId, "user-w");
    sm.notifyParticipantConnected(session.sessionId, "user-b");
    sm.submitMove(session.sessionId, "user-w", { from: "e2", to: "e4" });

    sm.notifyParticipantDisconnected(session.sessionId, "user-b");
    sm.notifyParticipantDisconnected(session.sessionId, "user-w");
    assert.equal(session.status, "PAUSED");

    await new Promise((resolve) => setTimeout(resolve, 60));

    assert.equal(session.status, "ABANDONED");
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].terminationReason, "forfeit");
    assert.deepEqual(emitted[0].outcome, { kind: "draw" });
  });
});
