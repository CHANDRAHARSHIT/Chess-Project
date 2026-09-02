/**
 * The trigger/action table. Manually defined for now; a database table once the
 * Feedback module needs to change rows without a deploy (see ./README.md §7).
 */

import type { TriggerActionRow } from "./types.js";

export const TRIGGER_ACTIONS: readonly TriggerActionRow[] = [
  { trigger: "post_game", action: "blunder_analysis", enabled: true },
  // Runs after blunder_analysis, which is what caches the game it aggregates.
  { trigger: "post_game", action: "whole_history_review", enabled: true },
];
