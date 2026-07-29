/**
 * WebSocket Topology Spike — M0 Validation Tool
 *
 * PURPOSE
 *   Proves that WebSocket connections survive the Vercel → Railway topology
 *   before M1 Transport is built. This is a throwaway validation tool, not
 *   production code.
 *
 * WHAT IT TESTS
 *   1. WebSocket handshake succeeds on the Railway direct URL.
 *   2. WebSocket handshake succeeds via a Vercel rewrite to Railway.
 *   3. Echo messages round-trip successfully (no payload corruption).
 *   4. A connection survives 30+ seconds (keepalive / no idle timeout).
 *   5. Reconnection after a deliberate close works.
 *
 * HOW TO RUN (local dev)
 *   cd backend
 *   npx tsx src/scripts/ws-spike.ts
 *   # Echo server starts on ws://localhost:3001/ws-spike
 *
 *   # Connect and test:
 *   npx wscat -c ws://localhost:3001/ws-spike
 *
 * HOW TO RUN (Railway staging)
 *   Deploy temporarily, or add a guarded route to the main app.
 *   Connect via:
 *   npx wscat -c wss://<your-railway-app>.up.railway.app/ws-spike
 *
 *   Then repeat via the Vercel domain that rewrites to Railway:
 *   npx wscat -c wss://<your-vercel-domain>.vercel.app/ws-spike
 *
 * OUTCOME DECISION
 *   PASS (all 5 checks above) → proceed with M1 Transport on Railway.
 *     - WebSocket path: use value of WS_PATH env var (default: /ws).
 *     - Update vercel.json with a rewrite rule for /ws if Vercel allows it.
 *   FAIL (Vercel blocks upgrade) → use direct Railway WebSocket URL.
 *     - Frontend connects to Railway WebSocket URL directly.
 *     - Vercel continues to serve only the HTTP API.
 *   Record the outcome in a short decision note before M1 begins.
 *
 * CLEANUP
 *   Delete or disable this route/file once the topology decision is recorded.
 */

import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.WS_SPIKE_PORT ?? "3001", 10);
const PATH = "/ws-spike";

// Heartbeat interval — detect stale connections (mirrors what M1 Transport will do).
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
// Mirrors what M1 Transport will do to detect stale connections.
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
  console.log(" XLChess — WebSocket Topology Spike (M0)");
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
