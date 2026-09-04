import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { GameReplay } from "../detection/GameReplay.js";
import type { PositionEval, StockfishEngine } from "../detection/engine/StockfishEngine.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Engine stub returning a scripted sequence, one entry per position evaluated
 * (the initial position, then one after each ply).
 */
function stubEngine(scores: number[], bestMove = "d2d4"): StockfishEngine {
  let call = 0;
  return {
    evaluate: async (): Promise<PositionEval> => ({
      scoreCp: scores[call++] ?? 0,
      bestMove,
      depth: 12,
    }),
  } as unknown as StockfishEngine;
}

describe("GameReplay", () => {
  it("normalises evaluations to the moving side's perspective", async () => {
    // Engine always reports from the side to move. A level game evaluated as
    // +20 for whoever is on move must not read as a loss for Black.
    const replay = new GameReplay(stubEngine([20, 20, 20]));

    const moves = await replay.replay({
      startingFen: START,
      moves: [
        { from: "e2", to: "e4" },
        { from: "e7", to: "e5" },
      ],
      chess960: false,
    });

    assert.equal(moves.length, 2);
    for (const move of moves) {
      // evalBefore +20 (mover better), evalAfter -20 once negated.
      assert.equal(move.evalBeforeCp, 20);
      assert.equal(move.evalAfterCp, -20);
    }
  });

  it("carries each position's evaluation forward instead of recomputing it", async () => {
    let calls = 0;
    const engine = {
      evaluate: async (): Promise<PositionEval> => {
        calls++;
        return { scoreCp: 0, bestMove: "d2d4", depth: 12 };
      },
    } as unknown as StockfishEngine;

    await new GameReplay(engine).replay({
      startingFen: START,
      moves: [
        { from: "e2", to: "e4" },
        { from: "e7", to: "e5" },
        { from: "g1", to: "f3" },
      ],
      chess960: false,
    });

    // n plies need n+1 positions, not 2n.
    assert.equal(calls, 4);
  });

  it("assigns alternating sides and sequential plies", async () => {
    const moves = await new GameReplay(stubEngine([0, 0, 0, 0])).replay({
      startingFen: START,
      moves: [
        { from: "e2", to: "e4" },
        { from: "e7", to: "e5" },
        { from: "g1", to: "f3" },
      ],
      chess960: false,
    });

    assert.deepEqual(
      moves.map((m) => [m.ply, m.side]),
      [
        [0, 0],
        [1, 1],
        [2, 0],
      ]
    );
  });

  it("records SAN and UCI, including the promotion piece", async () => {
    const replay = new GameReplay(stubEngine([0, 0]));

    const moves = await replay.replay({
      startingFen: "8/P6k/8/8/8/8/7K/8 w - - 0 1",
      moves: [{ from: "a7", to: "a8", promotion: "q" }],
      chess960: false,
    });

    assert.equal(moves[0].san, "a8=Q");
    assert.equal(moves[0].uci, "a7a8q");
  });

  it("stops at the first move that does not fit the board rather than guessing", async () => {
    // Second move is illegal from this position — a record/starting-position
    // mismatch. Analysis of a board that never existed would be worse than none.
    const moves = await new GameReplay(stubEngine([0, 0, 0])).replay({
      startingFen: START,
      moves: [
        { from: "e2", to: "e4" },
        { from: "a1", to: "a8" },
        { from: "e7", to: "e5" },
      ],
      chess960: false,
    });

    assert.equal(moves.length, 1);
  });

  it("returns nothing when the very first move is unplayable", async () => {
    const moves = await new GameReplay(stubEngine([0])).replay({
      startingFen: START,
      moves: [{ from: "e2", to: "e5" }],
      chess960: false,
    });

    assert.deepEqual(moves, []);
  });

  it("filters to one side when asked, keeping original ply numbers", async () => {
    const moves = await new GameReplay(stubEngine([0, 0, 0, 0])).replay({
      startingFen: START,
      moves: [
        { from: "e2", to: "e4" },
        { from: "e7", to: "e5" },
        { from: "g1", to: "f3" },
      ],
      chess960: false,
      sideIndex: 1,
    });

    assert.equal(moves.length, 1);
    assert.equal(moves[0].ply, 1);
    assert.equal(moves[0].side, 1);
  });

  it("carries the engine's preferred move for the position before each ply", async () => {
    const moves = await new GameReplay(stubEngine([0, 0], "g1f3")).replay({
      startingFen: START,
      moves: [{ from: "e2", to: "e4" }],
      chess960: false,
    });

    assert.deepEqual(moves[0].engineBestMoves, ["g1f3"]);
  });

  it("leaves think time at zero — it is not recorded during play", async () => {
    const moves = await new GameReplay(stubEngine([0, 0])).replay({
      startingFen: START,
      moves: [{ from: "e2", to: "e4" }],
      chess960: false,
    });

    assert.equal(moves[0].thinkTimeMs, 0);
  });
});
