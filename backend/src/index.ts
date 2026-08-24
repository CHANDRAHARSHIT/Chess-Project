import { env } from "./config/env.js";
import { app } from "./app.js";
import { initRollbar, reportError } from "./realtime/observability/index.js";
import { bootstrapTransport } from "./realtime/transport/index.js";
import {
  SessionManager,
  ClockTicker,
  sessionTransportImpl,
  wireSessionTransportBridge,
  wireMatchmakingSessionBridge,
} from "./realtime/session/index.js";
import { matchmakingQueue, ExpiryTicker } from "./realtime/matchmaking/index.js";
import { handleGameResult } from "./realtime/results/index.js";
import { attachBot, acquireBot, releaseBot } from "./realtime/bot/bot-player.js";
import type { GameResult, ParticipantAssignment } from "./contracts/index.js";

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

server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[Server Error]: Port ${env.PORT} is already in use (EADDRINUSE). Please terminate the process holding port ${env.PORT}.`
    );
  } else {
    console.error("[Server Error]:", err);
  }
});

// Transport + Session attach after server is live, flag-gated.
// Composition root: SessionManager is constructed here, not exported as a module singleton,
// so future consumers (Results in M4) receive it via injection.
if (env.MULTIPLAYER_ENABLED) {
  // each participant's now-stale MATCHED queue ticket (safe no-op if already gone) — otherwise
  // enqueue()'s idempotency check can hand back a finished game's descriptor for up to 5 minutes
  // — before forwarding to the existing, unmodified handleGameResult.
  const onResult = (result: GameResult) => {
    for (const participant of result.participants) {
      releaseBot(participant.userId);
      matchmakingQueue.releaseMatchedTicket(participant.userId);
    }
    handleGameResult(result);
  };

  const sessionManager = new SessionManager(onResult, undefined, sessionTransportImpl);
  const hooks = wireSessionTransportBridge(sessionManager);
  wireMatchmakingSessionBridge(matchmakingQueue, sessionManager);

  bootstrapTransport(server, hooks);

  new ClockTicker(sessionManager).start();

  // M1-AM-02: ExpiryTicker existed since M1 but was never started, so ticket TTL
  // expiry and MATCHED-ticket pruning never ran. Gap-fill, not a redesign — see
  // matchmaking_README.md M3 section.
  //
  // M7: the ~1s sweep interval and bot-fallback callback are only used once the bot
  // roster has attached successfully, and only when BOT_FALLBACK_ENABLED — otherwise
  // this reproduces the pre-M7 30s ticker with no callback exactly.
  if (env.BOT_FALLBACK_ENABLED) {
    attachBot(sessionManager).then(
      (attached) => {
        if (!attached) {
          reportError({
            domain: "bot",
            error: new Error("Bot fallback disabled for this process: roster attach failed."),
            fatal: false,
          });
          new ExpiryTicker(30_000).start();
          return;
        }

        new ExpiryTicker(1_000).start(() => {
          let bot: ParticipantAssignment | null = null;

          try {
            bot = acquireBot();
            if (!bot) return;

            const descriptor = matchmakingQueue.matchStaleTicketWithBot(bot, env.BOT_FALLBACK_DELAY_MS);
            if (!descriptor) releaseBot(bot.userId);
          } catch (err) {
            if (bot) releaseBot(bot.userId);
            reportError({ domain: "bot", error: err, fatal: false });
          }
        });
      },
      (err) => {
        reportError({ domain: "bot", error: err, fatal: true, context: { reason: "attach_bot_threw" } });
        new ExpiryTicker(30_000).start();
      }
    );
  } else {
    new ExpiryTicker(30_000).start();
  }
}
