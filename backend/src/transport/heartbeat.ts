import { connectionManager } from "./ConnectionManager.js";

const DEFAULT_PING_INTERVAL_MS = 15_000;
const DEFAULT_PONG_TIMEOUT_MS = 30_000;

/**
 * Ping/pong heartbeat timer for wire-liveness detection.
 *
 * INVARIANT: Heartbeat is wire-liveness detection ONLY.
 * It calls connectionManager.disconnect() on stale connections.
 * Heartbeat NEVER performs game actions, NEVER starts grace periods,
 * and NEVER triggers forfeits directly.
 */
export class HeartbeatTicker {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly pingIntervalMs: number = DEFAULT_PING_INTERVAL_MS,
    private readonly pongTimeoutMs: number = DEFAULT_PONG_TIMEOUT_MS
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.tick();
    }, this.pingIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    const now = Date.now();
    const connections = connectionManager.getAllConnections();

    for (const conn of connections) {
      if (conn.status !== "CONNECTED") continue;

      // Check if connection has timed out
      if (now - conn.lastPongAt > this.pongTimeoutMs) {
        connectionManager.disconnect(conn.id);
        try {
          conn.ws.terminate();
        } catch {
          // Socket already closed/dead
        }
        continue;
      }

      // Send ping message over wire
      try {
        if (conn.ws.readyState === 1 /* OPEN */) {
          conn.ws.ping();
        }
      } catch {
        connectionManager.disconnect(conn.id);
      }
    }
  }
}

export const heartbeatTicker = new HeartbeatTicker();
