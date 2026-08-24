import type http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { getSession } from "@auth/express";
import { env } from "../../config/env.js";
import { authConfig } from "../../config/auth.js";
import { connectionManager } from "./connection-manager.js";
import { heartbeatTicker } from "./heartbeat.js";
import type { InboundMessage } from "./transport.types.js";

/** Called for every post-handshake, non-reconnect message on a connection. */
export type AppMessageHandler = (userId: string, connectionId: string, message: { type: string; payload: unknown }) => void;

export interface TransportHooks {
  onAppMessage?: AppMessageHandler;
}

/**
 * Verifies the WS upgrade request against the existing Auth.js session (database strategy).
 * getSession() only reads `.protocol` and `.headers` off the request it's given — the raw
 * http.IncomingMessage from a WS upgrade doesn't carry `.protocol`, so it's supplied from AUTH_URL
 * (the same host/protocol normalisation already used for the `/api/auth/*` reverse-proxy fix in app.ts).
 */
async function authenticate(req: http.IncomingMessage): Promise<string | null> {
  try {
    const protocol = new URL(env.AUTH_URL).protocol.replace(":", "");
    const session = await getSession({ protocol, headers: req.headers } as any, authConfig);
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Top-level WebSocket transport server bootstrap.
 * Dependency direction: index.ts -> transport (Transport never imports index.ts or session.ts).
 */
export function bootstrapTransport(server: http.Server, hooks: TransportHooks = {}): void {
  const wsPath = env.WS_PATH || "/ws";
  const wss = new WebSocketServer({ server, path: wsPath });

  console.log(`[Transport]: WebSocket server bootstrapped on path '${wsPath}'`);

  wss.on("connection", async (ws: WebSocket, req: http.IncomingMessage) => {
    const userId = await authenticate(req);
    if (!userId) {
      ws.close(4401, "Unauthorized");
      return;
    }

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
          // AM-02 (Backend Stabilization, pre-M5): track the reconnected connection by its real,
          // persistent ConnectionId (returned by markReconnected), not the ResumeToken. The old
          // `currentConnId = parsed.resumeToken` assignment meant every subsequent recordPong()/
          // disconnect() call looked up a key ConnectionManager never indexed connections by —
          // pongs silently stopped registering, and HeartbeatTicker killed the socket ~30s later.
          const reconnectedId = connectionManager.markReconnected(
            parsed.resumeToken,
            parsed.lastReceivedSeq ?? 0,
            ws
          );
          if (reconnectedId) {
            currentConnId = reconnectedId;
            // M6 fix: the fresh-connection handshake branch below sends a `{type: "connected"}`
            // confirmation, but this reconnect branch never did — the client's connectionStatus
            // (driven solely by receiving that message type) stayed "reconnecting" forever even
            // though the reconnect fully succeeded. Routed through connectionManager.send() (not
            // a raw ws.send) so it gets a proper monotonic seq stamp and buffering, consistent
            // with every other outbound message on this logical connection.
            connectionManager.send(userId, {
              type: "connected",
              payload: { connectionId: reconnectedId, resumeToken: parsed.resumeToken },
            });
          } else {
            ws.close(4001, "Invalid or expired resume token");
          }
          return;
        }

        // Standard new connection handshake (first message on a fresh connection)
        if (!currentConnId) {
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
          return;
        }

        // Any message after the handshake is an application message.
        hooks.onAppMessage?.(userId, currentConnId, { type: parsed.type, payload: parsed.payload });
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
