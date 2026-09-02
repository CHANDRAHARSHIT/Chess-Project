import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { EventManager } from "../EventManager.js";
import type { EventPayload, TriggerActionRow } from "../types.js";

const EVENT: EventPayload = { trigger: "post_game", gameSessionId: "session-1" };

function rows(...specs: [string, boolean][]): TriggerActionRow[] {
  return specs.map(([action, enabled]) => ({ trigger: "post_game", action, enabled }));
}

/** Resolves once the manager's queue has drained. */
async function settled(manager: EventManager): Promise<void> {
  while (manager.pending > 0) await new Promise((r) => setImmediate(r));
}

describe("EventManager", () => {
  it("runs every enabled action registered for the trigger", async () => {
    const manager = new EventManager(rows(["a", true], ["b", true]));
    const ran: string[] = [];
    manager.register("a", () => void ran.push("a"));
    manager.register("b", () => void ran.push("b"));

    manager.emit(EVENT);
    await settled(manager);

    assert.deepEqual(ran.sort(), ["a", "b"]);
  });

  it("passes the event through to the handler", async () => {
    const manager = new EventManager(rows(["a", true]));
    let seen: EventPayload | undefined;
    manager.register("a", (event) => void (seen = event));

    manager.emit(EVENT);
    await settled(manager);

    assert.deepEqual(seen, EVENT);
  });

  it("skips disabled rows", async () => {
    const manager = new EventManager(rows(["a", false]));
    let ran = false;
    manager.register("a", () => void (ran = true));

    manager.emit(EVENT);
    await settled(manager);

    assert.equal(ran, false);
  });

  it("skips rows for a different trigger", async () => {
    const manager = new EventManager([
      { trigger: "post_tournament", action: "a", enabled: true },
    ]);
    let ran = false;
    manager.register("a", () => void (ran = true));

    manager.emit(EVENT);
    await settled(manager);

    assert.equal(ran, false);
  });

  it("does not throw when a row names an unregistered action", () => {
    const manager = new EventManager(rows(["nobody_registered", true]));
    assert.doesNotThrow(() => manager.emit(EVENT));
  });

  it("isolates a throwing action from the emitter and from other actions", async () => {
    const manager = new EventManager(rows(["sync_throw", true], ["async_throw", true], ["ok", true]));
    let okRan = false;
    manager.register("sync_throw", () => {
      throw new Error("sync");
    });
    manager.register("async_throw", async () => {
      throw new Error("async");
    });
    manager.register("ok", () => void (okRan = true));

    assert.doesNotThrow(() => manager.emit(EVENT));
    await settled(manager);

    assert.equal(okRan, true);
  });

  it("honours the concurrency limit", async () => {
    const manager = new EventManager(rows(["a", true], ["b", true]), 1);
    let concurrent = 0;
    let peak = 0;
    const slow = async () => {
      concurrent++;
      peak = Math.max(peak, concurrent);
      await new Promise((r) => setTimeout(r, 5));
      concurrent--;
    };
    manager.register("a", slow);
    manager.register("b", slow);

    manager.emit(EVENT);
    await settled(manager);

    assert.equal(peak, 1);
  });
});
