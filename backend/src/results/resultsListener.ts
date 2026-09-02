/**
 * Results Listener — the real `onResult` callback wired into SessionManager.
 *
 * SessionManager calls `this.onResult(result)` synchronously and unawaited,
 * inside its own try/catch that only guards synchronous throws (see
 * backend/src/session/SessionManager.ts). The listener MUST therefore:
 *   - never throw synchronously
 *   - never return a Promise (its signature matches ResultEmitter: void)
 *   - never let its internal async work produce an unhandled rejection
 *
 * Getting this wrong would let a database failure crash the whole process
 * via an unhandled promise rejection, taking down every other live game —
 * not just the one whose result failed to persist. See
 * m4_implementation_plan.md §1.10 (🔴 finding #2).
 */

import type { GameResult } from "../contracts/index.js";
import type { ResultEmitter } from "../session/index.js";
import { reportError } from "../observability/index.js";
import { persistGameResult } from "./resultsRepository.js";
import { eventManager } from "../events/index.js";

/**
 * Default post-persistence hook: raises `post_game` and lets the trigger/action
 * table decide what runs. Results does not know which actions exist.
 */
function emitPostGameEvent(gameSessionId: string): void {
  eventManager.emit({ trigger: "post_game", gameSessionId });
}

/**
 * Builds a fire-and-forget ResultEmitter around a persistence function.
 * Exported for testability (inject a fake persister) — mirrors SessionManager's
 * own constructor-injection pattern for onResult/variantResolver/transport.
 */
export function createResultsListener(
  persist: (result: GameResult) => Promise<void> = persistGameResult,
  onPersisted: (gameSessionId: string) => void = emitPostGameEvent
): ResultEmitter {
  return (result: GameResult): void => {
    persist(result)
      .then(() => {
        // Raising the event must never affect persistence or the finished game.
        // The event manager isolates the actions themselves; this guards only a
        // synchronous throw from the hook.
        try {
          onPersisted(result.gameSessionId);
        } catch (err) {
          reportError({
            domain: "events",
            error: err as Error,
            fatal: false,
            context: { gameSessionId: result.gameSessionId, reason: "post_game_emit_threw" },
          });
        }
      })
      .catch((err) => {
      // persistGameResult already reports its own failures internally; this catch
      // exists purely as a last-resort backstop so a truly unexpected throw can
      // never become an unhandled rejection.
      reportError({
        domain: "results",
        error: err,
        fatal: true,
        context: { gameSessionId: result.gameSessionId, reason: "unexpected_listener_failure" },
      });
    });
  };
}

/** The real listener wired into SessionManager's composition root. */
export const handleGameResult: ResultEmitter = createResultsListener();
