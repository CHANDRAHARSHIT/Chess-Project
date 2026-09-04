/**
 * Observability — Public barrel export
 *
 * IMPORT RULE: Always import from this barrel.
 *   ✓  import { emitTransition, reportError } from "../observability/index.js"
 *   ✗  import { reportError } from "../observability/observe.js"
 *
 * Rollbar initialisation:
 *   import { initRollbar } from "../observability/index.js"
 *   // Call initRollbar() once at server startup in index.ts.
 *
 * Usage in domains:
 *   import { emitTransition, reportError } from "../observability/index.js"
 *   import type { TransitionEvent, ErrorEvent } from "../observability/index.js"
 */

export { initRollbar, getRollbar } from "./rollbar.js";
export { emitTransition, reportError } from "./observe.js";
export type { ObservabilityDomain, TransitionEvent, ErrorEvent } from "./observe.js";
