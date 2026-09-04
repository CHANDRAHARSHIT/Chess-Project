import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  countExclusions,
  findExclusionReason,
  selectScoredPlies,
} from "../detection/ScoredMoves.js";
import { PolicyRegistry } from "../feedback/PolicyRegistry.js";
import type { PersistedPly } from "../analysisRepository.js";
import type { Situation } from "../types.js";

const SITUATION: Situation = { proficiency: "unknown", eventType: "unrated_game" };
const POLICY = new PolicyRegistry().getScoredMovePolicy(SITUATION);

/** A ply that passes every filter, so each test varies one thing. */
function buildPly(overrides: Partial<PersistedPly> = {}): PersistedPly {
  return {
    ply: POLICY.openingExcludedPlies + 2,
    side: 0,
    san: "Nf3",
    uci: "g1f3",
    evalBeforeCp: 0,
    evalAfterCp: 0,
    bestMove: "g1f3",
    legalMoveCount: 30,
    ...overrides,
  };
}

describe("scored-move filter", () => {
  it("counts a ply that passes every filter", () => {
    assert.equal(findExclusionReason(buildPly(), POLICY), undefined);
  });

  it("excludes opening plies, where Chess960 choices are near-arbitrary", () => {
    const lastExcluded = buildPly({ ply: POLICY.openingExcludedPlies - 1 });
    const firstIncluded = buildPly({ ply: POLICY.openingExcludedPlies });

    assert.equal(findExclusionReason(lastExcluded, POLICY), "opening");
    assert.equal(findExclusionReason(firstIncluded, POLICY), undefined);
  });

  it("excludes decided positions regardless of which side is winning", () => {
    const winning = buildPly({ evalBeforeCp: POLICY.decidedPositionCp });
    const losing = buildPly({ evalBeforeCp: -POLICY.decidedPositionCp });

    assert.equal(findExclusionReason(winning, POLICY), "decided_position");
    assert.equal(findExclusionReason(losing, POLICY), "decided_position");
  });

  it("excludes forced moves, which say nothing about who chose them", () => {
    assert.equal(findExclusionReason(buildPly({ legalMoveCount: 1 }), POLICY), "forced");
  });

  it("keeps a ply that is merely better, not decided", () => {
    const contested = buildPly({ evalBeforeCp: POLICY.decidedPositionCp - 1 });

    assert.equal(findExclusionReason(contested, POLICY), undefined);
  });

  it("selects only the plies that survive every filter", () => {
    const scored = selectScoredPlies(
      [
        buildPly({ ply: 0 }),
        buildPly({ ply: 20 }),
        buildPly({ ply: 21, legalMoveCount: 1 }),
        buildPly({ ply: 22, evalBeforeCp: 5000 }),
        buildPly({ ply: 23 }),
      ],
      POLICY
    );

    assert.deepEqual(
      scored.map((ply) => ply.ply),
      [20, 23]
    );
  });

  it("reports exclusion counts by reason for the evidence trail", () => {
    const counts = countExclusions(
      [
        buildPly({ ply: 0 }),
        buildPly({ ply: 1 }),
        buildPly({ legalMoveCount: 1 }),
        buildPly({ evalBeforeCp: -9000 }),
        buildPly(),
      ],
      POLICY
    );

    assert.deepEqual(counts, { opening: 2, decided_position: 1, forced: 1 });
  });

  it("cannot run the forced-position filter without a second engine line", () => {
    assert.equal(POLICY.forcedGapCp, null);
  });
});
