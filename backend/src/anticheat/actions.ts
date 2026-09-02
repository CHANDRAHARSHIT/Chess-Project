/**
 * Registers the ACS's actions with the platform event manager.
 *
 * The ACS owns what each action does; the trigger/action table in `events/`
 * owns when it runs. Keeping registration here means no other domain has to
 * import ACS internals to wire it up.
 */

import type { EventManager } from "../events/index.js";
import { runBlunderAnalysis } from "./AnalysisService.js";

export function registerAntiCheatActions(eventManager: EventManager): void {
  eventManager.registerAction("blunder_analysis", (event) =>
    runBlunderAnalysis(event.gameSessionId)
  );
}
