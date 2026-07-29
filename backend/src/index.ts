import { env } from "./config/env.js";
import { app } from "./app.js";
import { initRollbar } from "./observability/index.js";

// Initialise observability first so the very first server error is captured.
initRollbar();

/**
 * Capture the http.Server instance returned by app.listen().
 *
 * WHY: WebSocket servers must attach to an existing http.Server
 * via `new WebSocketServer({ server })` — they cannot open a second port.
 * Capturing it here and exporting it is the sole change required.
 */
export const server = app.listen(env.PORT, () => {
  console.log(
    `[Server]: Node.js Express server is listening in ${env.NODE_ENV} mode at http://localhost:${env.PORT}`,
  );
});

