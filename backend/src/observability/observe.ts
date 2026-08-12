/**
 * Observe — Transition-emit and error-report contract
 *
 * The single interface all multiplayer domains use for observability.
 * Domains never call Rollbar directly — they call emitTransition() or reportError().
 * This keeps the vendor SDK as an implementation detail of this module.
 *
 * USAGE IN STATE MACHINES
 *   Call emitTransition() at every state-machine transition:
 *
 *     emitTransition({ domain: "session", from: "WAITING", to: "READY" });
 *
 * USAGE AT ERROR BOUNDARIES
 *   Call reportError() at the boundary of the owning domain:
 *
 *     reportError({ domain: "matchmaking", error: err, fatal: false });
 *
 * INVARIANT
 *   No domain depends on Observability to function correctly.
 *   If Rollbar is down or unconfigured, every domain continues to operate.
 */

import { getRollbar } from "./rollbar.js";

// ─────────────────────────────────────────────────────────────────────────────
// Event types — what domains emit
// ─────────────────────────────────────────────────────────────────────────────

/** Every domain that participates in the transition-emit contract. */
export type ObservabilityDomain =
  | "matchmaking"
  | "session"
  | "transport"
  | "variant"
  | "results"
  | "http";

/**
 * A state-machine transition event.
 *
 * Emit one of these at every meaningful lifecycle transition.
 * "from" and "to" should be the exact state names used in the state machine.
 */
export interface TransitionEvent {
  /** Which domain produced this transition. */
  readonly domain: ObservabilityDomain;
  /** The state being left. */
  readonly from: string;
  /** The state being entered. */
  readonly to: string;
  /**
   * Optional structured context for the transition.
   * Include IDs (gameSessionId, matchId, userId) to make events searchable.
   * Never include sensitive data (passwords, tokens, PII beyond necessary IDs).
   */
  readonly context?: Record<string, unknown>;
}

/**
 * An error event at a domain boundary.
 *
 * Report one of these whenever an error occurs within a domain.
 * Fatal errors are escalated to Rollbar at the "critical" level.
 */
export interface ErrorEvent {
  /** Which domain owns this error. */
  readonly domain: ObservabilityDomain;
  /** The raw error — an Error instance or an unknown thrown value. */
  readonly error: unknown;
  /**
   * Optional structured context. Include IDs to correlate with transition events.
   */
  readonly context?: Record<string, unknown>;
  /**
   * Whether this error is fatal to the domain's operation.
   * Fatal = the domain cannot continue; a recovery/cleanup path has been triggered.
   * Non-fatal = the domain handled it and continued.
   */
  readonly fatal?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emit a state-machine transition event.
 *
 * Always logs to console. Sends to Rollbar as an informational event when
 * Rollbar is configured.
 */
export function emitTransition(event: TransitionEvent): void {
  const label = `[${event.domain}] ${event.from} → ${event.to}`;

  console.log(`[Observability] transition: ${label}`, event.context ?? "");

  const rollbar = getRollbar();
  if (rollbar) {
    rollbar.info(label, { transition: true, ...event.context });
  }
}

/**
 * Report an error at a domain boundary.
 *
 * Always logs to console. Escalates to Rollbar at "error" or "critical" level
 * (based on the fatal flag) when Rollbar is configured.
 *
 * Callers must not catch the error after calling this — it is the domain's
 * responsibility to decide what to do next (recover, transition to terminal, etc.).
 */
export function reportError(event: ErrorEvent): void {
  const message =
    event.error instanceof Error
      ? event.error.message
      : String(event.error);
  const level = event.fatal ? "CRITICAL" : "ERROR";

  console.error(
    `[Observability] ${level} [${event.domain}]: ${message}`,
    event.context ?? "",
  );

  const rollbar = getRollbar();
  if (rollbar) {
    const errArg =
      event.error instanceof Error
        ? event.error
        : typeof event.error === "string"
          ? event.error
          : String(event.error);

    if (event.fatal) {
      rollbar.critical(errArg, { domain: event.domain, ...event.context });
    } else {
      rollbar.error(errArg, { domain: event.domain, ...event.context });
    }
  }
}
