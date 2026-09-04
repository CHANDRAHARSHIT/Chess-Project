import { test, describe } from "node:test";
import assert from "node:assert/strict";
import type { WebSocket } from "ws";
import { ConnectionManager } from "../connection-manager.js";

// Mock WebSocket implementation for unit tests
class MockWebSocket {
  readyState = 1; // OPEN
  sentMessages: string[] = [];
  isTerminated = false;

  send(data: string): void {
    this.sentMessages.push(data);
  }

  ping(): void {}

  terminate(): void {
    this.isTerminated = true;
    this.readyState = 3; // CLOSED
  }
}

describe("ConnectionManager Transport Skeleton", () => {
  test("register creates CONNECTED entry and populates indices", () => {
    const cm = new ConnectionManager();
    const mockWs = new MockWebSocket() as unknown as WebSocket;

    const { connectionId, resumeToken } = cm.register(mockWs, "user-1");

    assert.ok(typeof connectionId === "string" && connectionId.length > 20);
    assert.ok(typeof resumeToken === "string" && resumeToken.length > 20);
    assert.equal(cm.isConnected("user-1"), true);
    assert.equal(cm.isConnected("user-unknown"), false);
  });

  test("disconnect updates status and removes from userIndex", () => {
    const cm = new ConnectionManager();
    const mockWs = new MockWebSocket() as unknown as WebSocket;

    const { connectionId } = cm.register(mockWs, "user-1");
    assert.equal(cm.isConnected("user-1"), true);

    cm.disconnect(connectionId);
    assert.equal(cm.isConnected("user-1"), false);
  });

  test("send stamps monotonically increasing seq scoped to logical connection", () => {
    const cm = new ConnectionManager();
    const mockWs = new MockWebSocket() as unknown as MockWebSocket;

    cm.register(mockWs as unknown as WebSocket, "user-1");

    cm.send("user-1", { type: "move", payload: { from: "e2", to: "e4" } });
    cm.send("user-1", { type: "move", payload: { from: "e7", to: "e5" } });

    assert.equal(mockWs.sentMessages.length, 2);
    const msg1 = JSON.parse(mockWs.sentMessages[0]);
    const msg2 = JSON.parse(mockWs.sentMessages[1]);

    assert.equal(msg1.seq, 1);
    assert.equal(msg2.seq, 2);
    assert.equal(msg1.type, "move");
  });

  test("reconnect replays messages since lastReceivedSeq and continues seq", () => {
    const cm = new ConnectionManager();
    const mockWs1 = new MockWebSocket() as unknown as MockWebSocket;

    const { connectionId, resumeToken } = cm.register(mockWs1 as unknown as WebSocket, "user-1");

    // Send 3 messages (seq 1, 2, 3)
    cm.send("user-1", { type: "msg1", payload: {} });
    cm.send("user-1", { type: "msg2", payload: {} });
    cm.send("user-1", { type: "msg3", payload: {} });

    // Client disconnects
    cm.disconnect(connectionId);
    assert.equal(cm.isConnected("user-1"), false);

    // Client reconnects with new WebSocket instance, claiming lastReceivedSeq = 1
    const mockWs2 = new MockWebSocket() as unknown as MockWebSocket;
    const reconnectedId = cm.markReconnected(resumeToken, 1, mockWs2 as unknown as WebSocket);

    // AM-02: markReconnected returns the persistent ConnectionId (same as the original
    // connectionId — it never changes across reconnects), not a boolean.
    assert.equal(reconnectedId, connectionId);
    assert.equal(cm.isConnected("user-1"), true);

    // mockWs2 should receive replayed messages for seq 2 and seq 3
    assert.equal(mockWs2.sentMessages.length, 2);
    const replayed1 = JSON.parse(mockWs2.sentMessages[0]);
    const replayed2 = JSON.parse(mockWs2.sentMessages[1]);
    assert.equal(replayed1.seq, 2);
    assert.equal(replayed2.seq, 3);

    // Next sent message continues monotonically at seq 4
    cm.send("user-1", { type: "msg4", payload: {} });
    assert.equal(mockWs2.sentMessages.length, 3);
    const msg4 = JSON.parse(mockWs2.sentMessages[2]);
    assert.equal(msg4.seq, 4);
  });

  test("reconnect rejects invalid resumeToken", () => {
    const cm = new ConnectionManager();
    const mockWs = new MockWebSocket() as unknown as WebSocket;

    const reconnectedId = cm.markReconnected("fake-token-999", 0, mockWs);
    assert.equal(reconnectedId, null);
  });

  // AM-02 (Backend Stabilization, pre-M5): verified regression test for the reconnect identity
  // bug. Before the fix, markReconnected() returned true/false and TransportServer.ts tracked the
  // reconnected socket by ResumeToken instead of ConnectionId, so recordPong()/disconnect() calls
  // after a reconnect silently no-op'd (wrong map key) — HeartbeatTicker would then kill the
  // "live" connection ~30s later on a false pong-timeout. This proves recordPong/disconnect work
  // correctly against the id markReconnected returns.
  test("recordPong and disconnect operate correctly on the id returned by markReconnected", () => {
    const cm = new ConnectionManager();
    const mockWs1 = new MockWebSocket() as unknown as WebSocket;
    const { connectionId, resumeToken } = cm.register(mockWs1, "user-1");

    cm.disconnect(connectionId);

    const mockWs2 = new MockWebSocket() as unknown as WebSocket;
    const reconnectedId = cm.markReconnected(resumeToken, 0, mockWs2);
    assert.ok(reconnectedId);

    // Simulate the heartbeat's pong bookkeeping against the identity the transport layer would
    // now track (the returned id) — this must find and update the live connection, not a phantom.
    cm.recordPong(reconnectedId!);
    const [conn] = cm.getAllConnections();
    assert.ok(Date.now() - conn.lastPongAt < 50);

    // And disconnect() against that same id must actually flip presence off.
    cm.disconnect(reconnectedId!);
    assert.equal(cm.isConnected("user-1"), false);
  });
});
