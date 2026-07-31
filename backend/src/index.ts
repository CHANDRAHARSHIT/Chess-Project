import { env } from "./config/env.js";
import { app } from "./app.js";
import { initRollbar } from "./observability/index.js";
import { bootstrapTransport } from "./transport/index.js";
import { SessionManager, ClockTicker, sessionTransportImpl, wireSessionTransportBridge } from "./session/index.js";
import { createInternalDevRouter } from "./routes/internalDev.route.js";

// Initialise observability first so the very first server error is captured.
initRollbar();

/**
 * Capture the http.Server instance returned by app.listen().
 *
 * WHY: WebSocket servers must attach to an existing http.Server
 * via `new WebSocketServer({ server })` — they cannot open a second port.
 */
export const server = app.listen(env.PORT, () => {
  console.log(
    `[Server]: Node.js Express server is listening in ${env.NODE_ENV} mode at http://localhost:${env.PORT}`,
  );
});

// Transport + Session attach after server is live, flag-gated.
// Composition root: SessionManager is constructed here, not exported as a module singleton,
// so future consumers (Results in M4, real Matchmaking wiring in M3) receive it via injection.
if (env.MULTIPLAYER_ENABLED) {
  const sessionManager = new SessionManager(undefined, undefined, sessionTransportImpl);
  const hooks = wireSessionTransportBridge(sessionManager);

  bootstrapTransport(server, hooks);
  app.use("/api/internal/dev", createInternalDevRouter(sessionManager));

  new ClockTicker(sessionManager).start();
}
