/**
 * Rollbar — Vendor initialisation and instance management
 *
 * Initialised once at server startup (index.ts).
 * All other observability code obtains the instance via getRollbar().
 *
 * GRACEFUL DEGRADATION
 *   When ROLLBAR_ACCESS_TOKEN is absent, Rollbar is disabled and a warning is
 *   logged. The rest of the application continues normally. No domain may
 *   error-out because Rollbar is unavailable.
 *   NOTE: env.ts currently lists ROLLBAR_ACCESS_TOKEN as required, so this
 *   branch is presently unreachable in practice — see PR discussion.
 */

import Rollbar from "rollbar";
import { env } from "../core/config/env.js";

let instance: Rollbar | null = null;

/**
 * Initialises the Rollbar SDK.
 *
 * Call this once at server startup, before any component that might produce
 * an error worth reporting.
 *
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function initRollbar(): void {
  if (instance) return; // Already initialised

  if (!env.ROLLBAR_ACCESS_TOKEN) {
    console.warn(
      "[Observability] ROLLBAR_ACCESS_TOKEN not set — error monitoring is disabled. " +
        "Set ROLLBAR_ACCESS_TOKEN in .env to enable Rollbar.",
    );
    return;
  }

  instance = new Rollbar({
    accessToken: env.ROLLBAR_ACCESS_TOKEN,
    environment: env.NODE_ENV,
    // Catch any unhandled exceptions or promise rejections that escape domain handlers.
    captureUncaught: true,
    captureUnhandledRejections: true,
    // Only log errors at warning level and above to Rollbar.
    reportLevel: "warning",
  });

  console.log(
    `[Observability] Rollbar initialised (environment: ${env.NODE_ENV})`,
  );
}

/**
 * Returns the active Rollbar instance, or null when Rollbar is not configured.
 *
 * All consumers check for null before calling any Rollbar method.
 */
export function getRollbar(): Rollbar | null {
  return instance;
}
