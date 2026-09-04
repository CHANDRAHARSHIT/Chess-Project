import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { MatchmakingQueue } from "../../matchmaking/index.js";
import { SessionManager } from "../session-manager.js";
import { wireMatchmakingSessionBridge } from "../matchmaking-session.bridge.js";

describe("Matchmaking ⇄ Session seam (M3)", () => {
  test("a real pairing creates a real GameSession reachable from both participants", () => {
    const queue = new MatchmakingQueue();
    const sm = new SessionManager();
    wireMatchmakingSessionBridge(queue, sm);

    queue.enqueue("user-1", "chess960");
    const { descriptor } = queue.enqueue("user-2", "chess960");

    assert.notEqual(descriptor, null);

    const sessionId = sm.getSessionIdForParticipant("user-1");
    assert.notEqual(sessionId, undefined);
    assert.equal(sm.getSessionIdForParticipant("user-2"), sessionId);

    const session = sm.getSession(sessionId!);
    assert.equal(session?.status, "WAITING");
    assert.equal(session?.matchDescriptor.matchId, descriptor!.matchId);
  });

  test("a session-creation failure compensates: both tickets refunded, no session left dangling", () => {
    const queue = new MatchmakingQueue();
    // No variant is registered under this id, so SessionManager.createSession() throws.
    const sm = new SessionManager(undefined, () => undefined);
    wireMatchmakingSessionBridge(queue, sm);

    queue.enqueue("user-1", "unregistered-variant");
    const { ticket, descriptor } = queue.enqueue("user-2", "unregistered-variant");

    // The bridge caught the throw and compensated before enqueue() returned.
    assert.equal(descriptor, null);
    assert.equal(ticket.status, "WAITING");
    assert.equal(sm.getSessionIdForParticipant("user-1"), undefined);
    assert.equal(sm.getSessionIdForParticipant("user-2"), undefined);

    // A third participant on the same (still-unregistered) variant re-triggers pairing
    // and must compensate again cleanly, without leaving any ticket stuck in MATCHED.
    const { descriptor: retryDescriptor } = queue.enqueue("user-3", "unregistered-variant");
    assert.equal(retryDescriptor, null);
    assert.equal(queue.getTicket(ticket.ticketId)?.status, "WAITING");
  });
});
