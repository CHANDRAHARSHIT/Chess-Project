/**
 * WebSocket Topology Validation Tool
 *
 * PURPOSE
 *   Proves that WebSocket connections survive the network topology.
 *   This is an isolated validation tool.
 *
 * WHAT IT TESTS
 *   1. WebSocket handshake succeeds.
 *   2. Echo messages round-trip successfully.
 *   3. A connection survives 30+ seconds (keepalive / no idle timeout).
 *   4. Reconnection after a deliberate close works.
 */

import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.WS_SPIKE_PORT ?? "3001", 10);
const PATH = "/ws-spike";

// Heartbeat interval — detect stale connections
const HEARTBEAT_INTERVAL_MS = 15_000;

// ─────────────────────────────────────────────────────────────────────────────
// Echo server
// ─────────────────────────────────────────────────────────────────────────────

const httpServer = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(
    "WebSocket Topology Spike — connect via WebSocket on " + PATH + "\n",
  );
});

const wss = new WebSocketServer({ server: httpServer, path: PATH });

// Track per-connection liveness for heartbeat validation.
interface ExtendedSocket extends WebSocket {
  isAlive?: boolean;
}

wss.on("connection", (socket: ExtendedSocket, req) => {
  const clientIp = req.socket.remoteAddress ?? "unknown";
  const connectedAt = new Date().toISOString();
  socket.isAlive = true;

  console.log(`[Spike] ✓ Connected  ip=${clientIp}  at=${connectedAt}`);

  // Greet the client so it can confirm the handshake completed.
  socket.send(
    JSON.stringify({
      type: "connected",
      message: "Topology spike echo server ready.",
      serverTime: connectedAt,
      instructions: "Send any JSON message and I will echo it back.",
    }),
  );

  // Respond to heartbeat pong frames.
  socket.on("pong", () => {
    socket.isAlive = true;
  });

  // Echo every inbound message with a server timestamp.
  socket.on("message", (raw) => {
    const text = raw.toString();
    console.log(`[Spike] ← message  ip=${clientIp}  payload=${text.slice(0, 120)}`);

    socket.send(
      JSON.stringify({
        type: "echo",
        original: text,
        serverTime: new Date().toISOString(),
      }),
    );

    console.log(`[Spike] → echo     ip=${clientIp}`);
  });

  socket.on("close", (code, reason) => {
    console.log(
      `[Spike] ✗ Disconnected  ip=${clientIp}  code=${code}  reason="${reason.toString()}"`,
    );
  });

  socket.on("error", (err) => {
    console.error(`[Spike] ! Socket error  ip=${clientIp}  err=${err.message}`);
  });
});

// Heartbeat loop — send a ping every HEARTBEAT_INTERVAL_MS.
const heartbeat = setInterval(() => {
  wss.clients.forEach((raw) => {
    const socket = raw as ExtendedSocket;
    if (socket.isAlive === false) {
      console.warn("[Spike] Terminating stale connection (no pong received).");
      socket.terminate();
      return;
    }
    socket.isAlive = false;
    socket.ping();
  });
}, HEARTBEAT_INTERVAL_MS);

wss.on("close", () => clearInterval(heartbeat));

// ─────────────────────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(" XLChess — WebSocket Topology Spike");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(` Echo server: ws://localhost:${PORT}${PATH}`);
  console.log(" Test with:   npx wscat -c ws://localhost:" + PORT + PATH);
  console.log(" Press Ctrl+C to stop.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
});

process.on("SIGINT", () => {
  console.log("\n[Spike] Shutting down…");
  httpServer.close(() => process.exit(0));
});
