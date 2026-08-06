/**
 * Session ⇄ Transport wiring — the only module that imports both `transport/`
 * and `session/` concretely (M1's independent pillars stay decoupled; this is
 * the seam anticipated by the M1 dependency map as "Session Wire Bridge (M2)").
 *
 * SCOPE: routing only. No game rules, no pairing logic, no persistence live here —
 * if a change needs any of those, it belongs in Session, Variant, or Results instead.
 */
import { connectionManager } from "../transport/index.js";
import type { TransportHooks } from "../transport/index.js";
import { reportError } from "../observability/index.js";
import type { Move } from "../contracts/index.js";
import type { SessionManager } from "./SessionManager.js";
import type { SessionTransport } from "./types.js";
import { maybePlayBotTurn } from "../bot/botPlayer.js";

/** Session's outbound view of Transport — a thin pass-through to the ConnectionManager singleton. */
export const sessionTransportImpl: SessionTransport = {
  send: (userId, message) => connectionManager.send(userId, message),
  broadcast: (userIds, message) => connectionManager.broadcast(userIds, message),
  isConnected: (userId) => connectionManager.isConnected(userId),
};

/**
 * Wires Transport's connection presence facts into Session's presence interpretation,
 * and returns the inbound-message hook for bootstrapTransport.
 *
 * Call once at startup: construct `sessionManager` with `sessionTransportImpl` first,
 * then pass it here, then pass the returned hooks into `bootstrapTransport`.
 */
export function wireSessionTransportBridge(sessionManager: SessionManager): TransportHooks {
  connectionManager.onConnectionEvent((event) => {
    const sessionId = sessionManager.getSessionIdForParticipant(event.userId);
    if (!sessionId) return;

    if (event.kind === "connected") {
      sessionManager.notifyParticipantConnected(sessionId, event.userId);
      maybePlayBotTurn(sessionManager, sessionId);
    } else {
      sessionManager.notifyParticipantDisconnected(sessionId, event.userId);
    }
  });

  return {
    onAppMessage: (userId, _connectionId, message) => {
      if (message.type !== "submit_move" && message.type !== "resign") return;

      const sessionId = sessionManager.getSessionIdForParticipant(userId);
      if (!sessionId) {
        // No throw, no crash — an informative reject at the transport boundary (Recommendation 5).
        connectionManager.send(userId, { type: "error", payload: { reason: "no_active_session" } });
        reportError({
          domain: "session",
          error: new Error(`${message.type} from '${userId}' with no active session.`),
          fatal: false,
          context: { userId },
        });
        return;
      }

      // AM-01 (Backend Stabilization, pre-M5): routes to the existing, unmodified forfeit() —
      // SessionManager already produces the correct GameResult; only the wire route was missing.
      if (message.type === "resign") {
        sessionManager.forfeit(sessionId, userId);
        return;
      }

      const result = sessionManager.submitMove(sessionId, userId, message.payload as Move);
      if (!result.legal) {
        connectionManager.send(userId, { type: "move_rejected", payload: { reason: result.reason } });
        return;
      }

      maybePlayBotTurn(sessionManager, sessionId);
    },
  };
}
