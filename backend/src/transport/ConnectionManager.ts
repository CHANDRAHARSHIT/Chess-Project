import crypto from "crypto";
import type { WebSocket } from "ws";
import { emitTransition, reportError } from "../observability/index.js";
import type { Connection, ConnectionId, ResumeToken, UserId, OutboundMessage } from "./types.js";
import { ReconnectBuffer } from "./reconnectBuffer.js";

/**
 * Single source of truth for all live WebSocket connections.
 * Completely rules-blind.
 */
export class ConnectionManager {
  private readonly connections = new Map<ConnectionId, Connection>();
  private readonly userIndex = new Map<UserId, ConnectionId>();
  private readonly resumeIndex = new Map<ResumeToken, ConnectionId>();
  private readonly buffer = new ReconnectBuffer();

  /**
   * Registers a newly connected WebSocket client.
   * Generates a new transient ConnectionId and a stable ResumeToken.
   */
  register(ws: WebSocket, userId: UserId): { connectionId: ConnectionId; resumeToken: ResumeToken } {
    const connectionId = crypto.randomUUID();
    const resumeToken = crypto.randomUUID();
    const now = Date.now();

    const connection: Connection = {
      id: connectionId,
      resumeToken,
      userId,
      ws,
      status: "CONNECTED",
      lastPongAt: now,
      nextSeq: 1,
    };

    this.connections.set(connectionId, connection);
    this.userIndex.set(userId, connectionId);
    this.resumeIndex.set(resumeToken, connectionId);

    emitTransition({
      domain: "transport",
      from: "CONNECTING",
      to: "CONNECTED",
      context: { connectionId, resumeToken, userId },
    });

    return { connectionId, resumeToken };
  }

  /**
   * Handles a client reconnect attempt using a stable ResumeToken.
   * Replaces the WebSocket reference and replays missed messages since lastReceivedSeq.
   */
  markReconnected(resumeToken: ResumeToken, lastReceivedSeq: number, newWs: WebSocket): boolean {
    const existingConnId = this.resumeIndex.get(resumeToken);
    if (!existingConnId) {
      const err = new Error(`Invalid or expired resumeToken '${resumeToken}'.`);
      reportError({ domain: "transport", error: err, fatal: false, context: { resumeToken } });
      return false;
    }

    const conn = this.connections.get(existingConnId);
    if (!conn) {
      const err = new Error(`Connection entry missing for resumeToken '${resumeToken}'.`);
      reportError({ domain: "transport", error: err, fatal: false, context: { resumeToken } });
      return false;
    }

    const oldStatus = conn.status;
    conn.status = "RECONNECTING";

    emitTransition({
      domain: "transport",
      from: oldStatus,
      to: "RECONNECTING",
      context: { connectionId: conn.id, resumeToken, userId: conn.userId },
    });

    // Update socket reference & active indexes
    conn.ws = newWs;
    conn.status = "CONNECTED";
    conn.lastPongAt = Date.now();
    this.userIndex.set(conn.userId, conn.id);

    emitTransition({
      domain: "transport",
      from: "RECONNECTING",
      to: "CONNECTED",
      context: { connectionId: conn.id, resumeToken, userId: conn.userId },
    });

    // Replay buffered messages
    const replayMsgs = this.buffer.replay(resumeToken, lastReceivedSeq);
    for (const msg of replayMsgs) {
      try {
        if (newWs.readyState === 1 /* OPEN */) {
          newWs.send(JSON.stringify(msg));
        }
      } catch (err) {
        reportError({ domain: "transport", error: err, fatal: false, context: { resumeToken, seq: msg.seq } });
      }
    }

    return true;
  }

  /**
   * Marks a connection as DISCONNECTED.
   * Retains buffer and resumeToken index for reconnection window.
   * Removes from userIndex so isConnected(userId) immediately returns false.
   */
  disconnect(connectionId: ConnectionId): void {
    const conn = this.connections.get(connectionId);
    if (!conn || conn.status === "DISCONNECTED") return;

    const oldStatus = conn.status;
    conn.status = "DISCONNECTED";

    this.userIndex.delete(conn.userId);

    emitTransition({
      domain: "transport",
      from: oldStatus,
      to: "DISCONNECTED",
      context: { connectionId, resumeToken: conn.resumeToken, userId: conn.userId },
    });
  }

  /**
   * Sends an outbound message to a user.
   * Stamps with monotonically increasing sequence number and buffers for replay.
   */
  send(userId: UserId, message: { type: string; payload: unknown }): void {
    const connId = this.userIndex.get(userId);
    if (!connId) return;

    const conn = this.connections.get(connId);
    if (!conn || conn.status !== "CONNECTED") return;

    const outboundMsg: OutboundMessage = {
      seq: conn.nextSeq++,
      type: message.type,
      payload: message.payload,
    };

    this.buffer.push(conn.resumeToken, outboundMsg);

    try {
      if (conn.ws.readyState === 1 /* OPEN */) {
        conn.ws.send(JSON.stringify(outboundMsg));
      }
    } catch (err) {
      reportError({ domain: "transport", error: err, fatal: false, context: { userId, connectionId: connId } });
    }
  }

  /**
   * Broadcasts a message to multiple users.
   */
  broadcast(userIds: UserId[], message: { type: string; payload: unknown }): void {
    for (const userId of userIds) {
      this.send(userId, message);
    }
  }

  /**
   * O(1) wire presence check.
   * Returns true if user has an active, CONNECTED WebSocket.
   */
  isConnected(userId: UserId): boolean {
    const connId = this.userIndex.get(userId);
    if (!connId) return false;
    const conn = this.connections.get(connId);
    return conn !== undefined && conn.status === "CONNECTED";
  }

  /** Updates lastPongAt for a connection */
  recordPong(connectionId: ConnectionId): void {
    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.lastPongAt = Date.now();
    }
  }

  /** Returns all active connections (for heartbeat iteration) */
  getAllConnections(): Connection[] {
    return Array.from(this.connections.values());
  }
}

export const connectionManager = new ConnectionManager();
