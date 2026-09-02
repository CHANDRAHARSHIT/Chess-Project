/**
 * featureFlags.ts
 *
 * Single source of truth for environment-driven feature flags.
 *
 * Usage:
 *   import { IS_PROD, featureFlags } from "@/shared/lib/featureFlags";
 *
 * How to control:
 *   - Set VITE_IS_PROD='true'  in .env (or your deployment env) to enable prod mode.
 *   - Set VITE_IS_PROD='false' (or leave unset) for development/staging — all
 *     in-development features will be visible.
 */

/** True when the app is running in production mode. */
export const IS_PROD: boolean =
  import.meta.env.VITE_IS_PROD === "true";

/**
 * Feature flags derived from IS_PROD.
 *
 * Add new flags here as features graduate from development → production.
 * Convention: flags named `show*` / `enable*` — true means "visible/enabled".
 */
export const featureFlags = {
  /** Show "Build Lessons" in the sidebar navigation. Hidden in prod. */
  showBuildLessons: !IS_PROD,

  /** Show "Odyssey" in the sidebar navigation. Hidden in prod. */
  showOdyssey: !IS_PROD,

  /** Enable the "Play Online" tab in the Play Hub. Disabled in prod. */
  enablePlayOnline: !IS_PROD,

  /** Show "Maia" mode in the Play Hub. Hidden in prod. */
  showMaia: !IS_PROD,
  enableMaia: !IS_PROD,
} as const;
