import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildPersistedPlies } from "../analysisRepository.js";
import type { AnalyzedMove } from "../types.js";

function buildMove(overrides: Partial<AnalyzedMove> = {}): AnalyzedMove {
  return {
    ply: 0,
    side: 0,
    fenBefore: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    san: "e4",
    uci: "e2e4",
    thinkTimeMs: 0,
    clockRemainingMs: 0,
    evalBeforeCp: 20,
    evalAfterCp: 15,
    engineBestMoves: ["d2d4"],
    legalMoveCount: 20,
    ...overrides,
  };
}

describe("buildPersistedPlies", () => {
  it("keeps the raw engine fields a later re-aggregation needs", () => {
    const [ply] = buildPersistedPlies([buildMove()]);

    assert.deepEqual(ply, {
      ply: 0,
      side: 0,
      san: "e4",
      uci: "e2e4",
      evalBeforeCp: 20,
      evalAfterCp: 15,
      bestMove: "d2d4",
      legalMoveCount: 20,
    });
  });

  it("stores no policy-dependent classification", () => {
    const [ply] = buildPersistedPlies([buildMove()]);

    for (const derivedField of ["quality", "centipawnLoss", "accuracy", "matchedEngineBest"]) {
      assert.equal(derivedField in ply, false, `${derivedField} must not be persisted`);
    }
  });

  it("drops plies the engine could not evaluate rather than storing them as level", () => {
    const plies = buildPersistedPlies([
      buildMove({ ply: 0 }),
      buildMove({ ply: 1, evalBeforeCp: undefined }),
      buildMove({ ply: 2, evalAfterCp: undefined }),
    ]);

    assert.deepEqual(
      plies.map((persisted) => persisted.ply),
      [0]
    );
  });

  it("omits uci and bestMove when the engine gave none", () => {
    const [ply] = buildPersistedPlies([buildMove({ uci: undefined, engineBestMoves: [] })]);

    assert.equal("uci" in ply, false);
    assert.equal("bestMove" in ply, false);
  });
});
