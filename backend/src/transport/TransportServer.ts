import type http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { env } from "../config/env.js";
import { connectionManager } from "./ConnectionManager.js";
import { heartbeatTicker } from "./heartbeat.js";
import type { InboundMessage } from "./types.js";

/**
 * Top-level WebSocket transport server bootstrap.
 * Dependency direction: index.ts -> transport (Transport never imports index.ts).
 */
export function bootstrapTransport(server: http.Server): void {
  const wsPath = env.WS_PATH || "/ws";
  const wss = new WebSocketServer({ server, path: wsPath });

  console.log(`[Transport]: WebSocket server bootstrapped on path '${wsPath}'`);

  wss.on("connection", (ws: WebSocket, req: http.IncomingMessage) => {
    let currentConnId: string | null = null;

    ws.on("pong", () => {
      if (currentConnId) {
        connectionManager.recordPong(currentConnId);
      }
    });

    ws.on("message", (raw: string | Buffer) => {
      try {
        const msgStr = typeof raw === "string" ? raw : raw.toString("utf-8");
        const parsed = JSON.parse(msgStr) as InboundMessage;

        // Check if this is a reconnection handshake
        if (parsed.resumeToken) {
          const success = connectionManager.markReconnected(
            parsed.resumeToken,
            parsed.lastReceivedSeq ?? 0,
            ws
          );
          if (success) {
            currentConnId = parsed.resumeToken;
          } else {
            ws.close(4001, "Invalid or expired resume token");
          }
          return;
        }

        // Standard new connection handshake
        if (!currentConnId) {
          const userId = (parsed.payload as any)?.userId || "dev-user-ws";
          const { connectionId, resumeToken } = connectionManager.register(ws, userId);
          currentConnId = connectionId;

          // Send handshake confirmation with resumeToken back to client
          ws.send(
            JSON.stringify({
              seq: 0,
              type: "connected",
              payload: { connectionId, resumeToken },
            })
          );
        }
      } catch {
        // Invalid JSON payload
      }
    });

    ws.on("close", () => {
      if (currentConnId) {
        connectionManager.disconnect(currentConnId);
      }
    });

    ws.on("error", () => {
      if (currentConnId) {
        connectionManager.disconnect(currentConnId);
      }
    });
  });

  heartbeatTicker.start();
}
