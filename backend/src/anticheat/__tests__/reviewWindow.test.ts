import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildReviewWindow } from "../detection/ReviewWindow.js";
import { PolicyRegistry } from "../feedback/PolicyRegistry.js";
import type { PersistedPly, ReviewCandidate } from "../analysisRepository.js";
import type { Situation } from "../types.js";

const SITUATION: Situation = { proficiency: "unknown", eventType: "unrated_game" };
const policy = new PolicyRegistry();
const WINDOW_POLICY = policy.getReviewWindowPolicy(SITUATION);
const SCORED_MOVE_POLICY = policy.getScoredMovePolicy(SITUATION);

function buildPly(ply: number, side: number, overrides: Partial<PersistedPly> = {}): PersistedPly {
  return {
    ply,
    side,
    san: "Nf3",
    uci: "g1f3",
    evalBeforeCp: 0,
    evalAfterCp: 0,
    bestMove: "g1f3",
    legalMoveCount: 30,
    ...overrides,
  };
}

/** A game with scoreable plies for both sides. */
function buildCandidate(
  gameRecordId: string,
  side = 0,
  overrides: Partial<ReviewCandidate> = {}
): ReviewCandidate {
  const firstScoredPly = SCORED_MOVE_POLICY.openingExcludedPlies;
  return {
    gameRecordId,
    side,
    endedAt: new Date("2026-09-01T00:00:00.000Z"),
    engineName: "stockfish-18-lite-single",
    engineDepth: 12,
    plies: [
      buildPly(firstScoredPly, 0),
      buildPly(firstScoredPly + 1, 1),
      buildPly(firstScoredPly + 2, 0),
      buildPly(firstScoredPly + 3, 1),
    ],
    ...overrides,
  };
}

function buildWindow(candidates: readonly ReviewCandidate[], rating: number | null = 1500) {
  return buildReviewWindow({
    userId: "user-1",
    situation: SITUATION,
    rating,
    candidates,
    windowPolicy: WINDOW_POLICY,
    scoredMovePolicy: SCORED_MOVE_POLICY,
  });
}

describe("buildReviewWindow", () => {
  it("keeps only the suspect's own plies", () => {
    const window = buildWindow([buildCandidate("game-1", 0)]);

    assert.equal(window.games.length, 1);
    assert.deepEqual([...new Set(window.games[0].plies.map((ply) => ply.side))], [0]);
  });

  it("scores each game separately, since the pattern rules need per-game figures", () => {
    const window = buildWindow([buildCandidate("game-1"), buildCandidate("game-2")]);

    assert.deepEqual(
      window.games.map((game) => game.gameRecordId),
      ["game-1", "game-2"]
    );
  });

  it("excludes a game where every ply was filtered out", () => {
    const allOpeningPlies = buildCandidate("game-1", 0, {
      plies: [buildPly(0, 0), buildPly(2, 0)],
    });

    const window = buildWindow([allOpeningPlies]);

    assert.deepEqual(window.games, []);
    assert.deepEqual(window.excludedGames, [
      { gameRecordId: "game-1", reason: "no_scored_moves" },
    ]);
  });

  it("excludes a game the suspect has no plies in", () => {
    const window = buildWindow([
      buildCandidate("game-1", 0, { plies: [buildPly(20, 1), buildPly(22, 1)] }),
    ]);

    assert.deepEqual(window.excludedGames, [{ gameRecordId: "game-1", reason: "wrong_side" }]);
  });

  it("reports insufficient evidence below the minimum game count", () => {
    const tooFew = Array.from({ length: WINDOW_POLICY.minAnalysableGames - 1 }, (_, index) =>
      buildCandidate(`game-${index}`)
    );

    assert.equal(buildWindow(tooFew).isSufficient, false);
  });

  it("is sufficient at exactly the minimum game count", () => {
    const justEnough = Array.from({ length: WINDOW_POLICY.minAnalysableGames }, (_, index) =>
      buildCandidate(`game-${index}`)
    );

    assert.equal(buildWindow(justEnough).isSufficient, true);
  });

  it("flags a window mixing engine depths, whose evaluations are not comparable", () => {
    const window = buildWindow([
      buildCandidate("game-1"),
      buildCandidate("game-2", 0, { engineDepth: 18 }),
    ]);

    assert.equal(window.isEngineConsistent, false);
  });

  it("carries a null rating through rather than inventing one", () => {
    assert.equal(buildWindow([buildCandidate("game-1")], null).rating, null);
  });
});
