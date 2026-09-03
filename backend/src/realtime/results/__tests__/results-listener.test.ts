import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createResultsListener } from "../results-listener.js";
import type { GameResult } from "../../../contracts/index.js";

const sampleResult: GameResult = {
  gameSessionId: "session-1",
  matchId: "match-1",
  terminationReason: "checkmate",
  outcome: { kind: "win", winningSide: 0 },
  participants: [
    { userId: "user-1", side: 0 },
    { userId: "user-2", side: 1 },
  ],
  variantId: "chess960",
  rated: false,
  provenance: "queue",
  endedAt: new Date().toISOString(),
  moveCount: 10,
};

describe("resultsListener — Session never blocks on Results (Invariant 14)", () => {
  test("never throws synchronously, even when persistence always rejects", () => {
    const listener = createResultsListener(async () => {
      throw new Error("simulated DB outage");
    });

    assert.doesNotThrow(() => listener(sampleResult));
  });

  test("returns void (not a Promise), matching the ResultEmitter contract SessionManager expects", () => {
    const listener = createResultsListener(async () => {});
    const returnValue = listener(sampleResult);
    assert.equal(returnValue, undefined);
  });

  test("produces no unhandled promise rejection when persistence rejects", async () => {
    let unhandled = false;
    const onUnhandledRejection = () => {
      unhandled = true;
    };
    process.on("unhandledRejection", onUnhandledRejection);

    try {
      const listener = createResultsListener(async () => {
        throw new Error("simulated DB outage");
      });
      listener(sampleResult);

      // Let the listener's internal .catch() flush before asserting.
      await new Promise((resolve) => setImmediate(resolve));

      assert.equal(unhandled, false);
    } finally {
      process.off("unhandledRejection", onUnhandledRejection);
    }
  });
});

describe("resultsListener — post-game analysis hook", () => {
  const flush = () => new Promise((resolve) => setImmediate(resolve));

  test("runs the hook with the session id once persistence succeeds", async () => {
    const seen: string[] = [];
    const listener = createResultsListener(async () => {}, (id) => seen.push(id));

    listener(sampleResult);
    await flush();

    assert.deepEqual(seen, ["session-1"]);
  });

  test("does not run the hook when persistence fails", async () => {
    // Analysis reads the record Results was supposed to write. Running it after
    // a failed persist would only produce a spurious 'game not found'.
    let called = false;
    const listener = createResultsListener(
      async () => {
        throw new Error("simulated DB outage");
      },
      () => {
        called = true;
      }
    );

    listener(sampleResult);
    await flush();

    assert.equal(called, false);
  });

  test("a throwing hook cannot escape as an unhandled rejection", async () => {
    let unhandled = false;
    const onUnhandledRejection = () => {
      unhandled = true;
    };
    process.on("unhandledRejection", onUnhandledRejection);

    try {
      const listener = createResultsListener(
        async () => {},
        () => {
          throw new Error("analysis exploded");
        }
      );

      assert.doesNotThrow(() => listener(sampleResult));
      await flush();
      await flush();

      assert.equal(unhandled, false);
    } finally {
      process.off("unhandledRejection", onUnhandledRejection);
    }
  });
});
