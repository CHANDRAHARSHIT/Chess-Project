/**
 * Matchmaking ⇄ Session wiring — the only module that imports both `matchmaking/`
 * and `session/` concretely (mirrors sessionTransportBridge.ts's role for the
 * Transport ⇄ Session seam). This is the seam anticipated by M1's dependency map
 * as "Matchmaking → Seam Integration (M3)".
 *
 * SCOPE: routing + compensation only. No pairing logic (that's MatchmakingQueue's),
 * no game/session lifecycle logic (that's SessionManager's). If a change needs
 * either of those, it belongs in Matchmaking or Session instead.
 */
import { reportError } from "../observability/index.js";
import type { MatchmakingQueue } from "../matchmaking/index.js";
import type { SessionManager } from "./SessionManager.js";

/**
 * Wires MatchmakingQueue's match events into real session creation.
 *
 * Call once at startup, after both `matchmakingQueue` and `sessionManager` exist.
 * On successful pairing, creates a real GameSession from the produced MatchDescriptor.
 * On failure (e.g. an unregistered variant), compensates by refunding both tickets
 * back to the queue — the "ticket-consumed-but-session-failed" path required by M3.
 */
export function wireMatchmakingSessionBridge(queue: MatchmakingQueue, sessionManager: SessionManager): void {
  queue.onMatch((descriptor) => {
    try {
      sessionManager.createSession(descriptor);
    } catch (err) {
      reportError({
        domain: "matchmaking",
        error: err,
        fatal: false,
        context: { matchId: descriptor.matchId, reason: "session_creation_failed" },
      });
      queue.compensateFailedMatch(descriptor);
    }
  });
}
