import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { SessionManager } from "../SessionManager.js";
import { wireSessionTransportBridge } from "../sessionTransportBridge.js";
import type { MatchDescriptor, GameResult } from "../../contracts/index.js";

function createDummyDescriptor(): MatchDescriptor {
  return {
    matchId: "match-uuid-am01",
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

describe("AM-01 (Backend Stabilization, pre-M5): resign routed through the Session <-> Transport bridge", () => {
  test("a 'resign' app message forfeits the sender's session and emits the correct GameResult", () => {
    const emitted: GameResult[] = [];
    const sm = new SessionManager((r) => emitted.push(r));
    const session = sm.createSession(createDummyDescriptor());
    sm.notifyAllPresent(session.sessionId);

    const hooks = wireSessionTransportBridge(sm);

    hooks.onAppMessage!("user-b", "conn-1", { type: "resign", payload: {} });

    assert.equal(session.status, "ABANDONED");
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].terminationReason, "forfeit");
    assert.deepEqual(emitted[0].outcome, { kind: "win", winningSide: 0 });
  });

  test("'resign' from a user with no active session is rejected informatively, not thrown", () => {
    const sm = new SessionManager();
    const hooks = wireSessionTransportBridge(sm);

    assert.doesNotThrow(() => {
      hooks.onAppMessage!("stranger", "conn-2", { type: "resign", payload: {} });
    });
  });

  test("unrelated message types are still ignored by the bridge", () => {
    const sm = new SessionManager();
    const session = sm.createSession(createDummyDescriptor());
    sm.notifyAllPresent(session.sessionId);
    const hooks = wireSessionTransportBridge(sm);

    hooks.onAppMessage!("user-w", "conn-3", { type: "ping", payload: {} });
    assert.equal(session.status, "READY"); // untouched — SessionManager itself was never modified
  });
});
