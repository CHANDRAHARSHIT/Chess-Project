import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { EventManager } from "../EventManager.js";
import { TRIGGER_ACTIONS } from "../triggerActions.js";
import { registerAntiCheatActions } from "../../anticheat/index.js";

/**
 * Guards the one failure mode the dispatcher cannot report loudly: an action
 * named in the table that nobody registers only produces a console warning, so
 * the feature silently never runs.
 */
describe("action registration", () => {
  it("registers a handler for every enabled action in the table", () => {
    const manager = new EventManager(TRIGGER_ACTIONS);
    registerAntiCheatActions(manager);

    const unregistered = TRIGGER_ACTIONS.filter(
      (row) => row.enabled && !manager.hasAction(row.action)
    ).map((row) => row.action);

    assert.deepEqual(unregistered, []);
  });
});
