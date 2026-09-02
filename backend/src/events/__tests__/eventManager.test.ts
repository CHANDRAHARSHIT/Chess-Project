import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { EventManager } from "../EventManager.js";
import type { EventPayload, TriggerActionRow } from "../types.js";

const POST_GAME_EVENT: EventPayload = { trigger: "post_game", gameSessionId: "session-1" };

function buildPostGameRows(...actions: [actionId: string, enabled: boolean][]): TriggerActionRow[] {
  return actions.map(([action, enabled]) => ({ trigger: "post_game", action, enabled }));
}

async function waitForQueueToDrain(manager: EventManager): Promise<void> {
  while (manager.getPendingActionCount() > 0) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

describe("EventManager", () => {
  it("runs every enabled action registered for the trigger", async () => {
    const manager = new EventManager(buildPostGameRows(["a", true], ["b", true]));
    const actionsRun: string[] = [];
    manager.registerAction("a", () => void actionsRun.push("a"));
    manager.registerAction("b", () => void actionsRun.push("b"));

    manager.emit(POST_GAME_EVENT);
    await waitForQueueToDrain(manager);

    assert.deepEqual(actionsRun.sort(), ["a", "b"]);
  });

  it("passes the event through to the handler", async () => {
    const manager = new EventManager(buildPostGameRows(["a", true]));
    let receivedEvent: EventPayload | undefined;
    manager.registerAction("a", (event) => void (receivedEvent = event));

    manager.emit(POST_GAME_EVENT);
    await waitForQueueToDrain(manager);

    assert.deepEqual(receivedEvent, POST_GAME_EVENT);
  });

  it("skips disabled rows", async () => {
    const manager = new EventManager(buildPostGameRows(["a", false]));
    let actionRan = false;
    manager.registerAction("a", () => void (actionRan = true));

    manager.emit(POST_GAME_EVENT);
    await waitForQueueToDrain(manager);

    assert.equal(actionRan, false);
  });

  it("skips rows belonging to a different trigger", async () => {
    const manager = new EventManager([
      { trigger: "post_tournament", action: "a", enabled: true },
    ]);
    let actionRan = false;
    manager.registerAction("a", () => void (actionRan = true));

    manager.emit(POST_GAME_EVENT);
    await waitForQueueToDrain(manager);

    assert.equal(actionRan, false);
  });

  it("does not throw when a row names an unregistered action", () => {
    const manager = new EventManager(buildPostGameRows(["nobody_registered", true]));

    assert.doesNotThrow(() => manager.emit(POST_GAME_EVENT));
  });

  it("isolates a throwing action from the emitter and from other actions", async () => {
    const manager = new EventManager(
      buildPostGameRows(["sync_throw", true], ["async_throw", true], ["healthy", true])
    );
    let healthyActionRan = false;
    manager.registerAction("sync_throw", () => {
      throw new Error("thrown synchronously");
    });
    manager.registerAction("async_throw", async () => {
      throw new Error("rejected");
    });
    manager.registerAction("healthy", () => void (healthyActionRan = true));

    assert.doesNotThrow(() => manager.emit(POST_GAME_EVENT));
    await waitForQueueToDrain(manager);

    assert.equal(healthyActionRan, true);
  });

  it("never runs more actions at once than the concurrency limit allows", async () => {
    const manager = new EventManager(buildPostGameRows(["a", true], ["b", true]), 1);
    let concurrentActionCount = 0;
    let peakConcurrentActionCount = 0;
    const slowAction = async () => {
      concurrentActionCount++;
      peakConcurrentActionCount = Math.max(peakConcurrentActionCount, concurrentActionCount);
      await new Promise((resolve) => setTimeout(resolve, 5));
      concurrentActionCount--;
    };
    manager.registerAction("a", slowAction);
    manager.registerAction("b", slowAction);

    manager.emit(POST_GAME_EVENT);
    await waitForQueueToDrain(manager);

    assert.equal(peakConcurrentActionCount, 1);
  });
});
