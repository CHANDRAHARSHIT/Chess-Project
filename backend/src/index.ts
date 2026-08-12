import { env } from "./config/env.js";
import { app } from "./app.js";
import { initRollbar } from "./observability/index.js";
import { bootstrapTransport } from "./transport/index.js";
import {
  SessionManager,
  ClockTicker,
  sessionTransportImpl,
  wireSessionTransportBridge,
  wireMatchmakingSessionBridge,
} from "./session/index.js";
import { matchmakingQueue, ExpiryTicker } from "./matchmaking/index.js";

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
// so future consumers (Results in M4) receive it via injection.
if (env.MULTIPLAYER_ENABLED) {
  const sessionManager = new SessionManager(undefined, undefined, sessionTransportImpl);
  const hooks = wireSessionTransportBridge(sessionManager);
  wireMatchmakingSessionBridge(matchmakingQueue, sessionManager);

  bootstrapTransport(server, hooks);

  new ClockTicker(sessionManager).start();

  // M1-AM-02: ExpiryTicker existed since M1 but was never started, so ticket TTL
  // expiry and MATCHED-ticket pruning never ran. Gap-fill, not a redesign — see
  // matchmaking_README.md M3 section.
  new ExpiryTicker().start();
}
