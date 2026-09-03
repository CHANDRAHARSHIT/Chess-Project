import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { CompensationManager } from "../compensation/CompensationManager.js";
import type {
  CompensationRepository,
  NewCompensationInput,
} from "../compensation/compensationRepository.js";
import type { AffectedUser, CaseStatus, CompensationRecord, ReviewCase } from "../types.js";

function buildCase(status: CaseStatus, flagged: string[] = ["g1", "g2"]): ReviewCase {
  return {
    caseId: "case-1",
    suspect: {
      userId: "cheater",
      ratingAtEvent: null,
      proficiency: "unknown",
      priorStrikeCount: 0,
      underHeightenedScrutiny: false,
    },
    situation: { proficiency: "unknown", eventType: "unrated_game" },
    status,
    outcomes: [],
    evidence: [],
    flaggedGameRecordIds: flagged,
    affectedUsers: [],
    openedAt: new Date(),
  };
}

function buildFakeRepository(opponents: AffectedUser[]) {
  const saved: NewCompensationInput[] = [];
  const lookups: { gameRecordIds: readonly string[]; suspectUserId: string }[] = [];

  const repository: CompensationRepository = {
    async saveCompensation(input) {
      saved.push(input);
      return { ...input, compensationId: `c-${saved.length}`, issuedAt: new Date() } as
        CompensationRecord;
    },
    async findCompensationHistory() {
      return [];
    },
    async findOpponentsInGames(gameRecordIds, suspectUserId) {
      lookups.push({ gameRecordIds, suspectUserId });
      return opponents;
    },
  };

  return { repository, saved, lookups };
}

describe("CompensationManager.compensate", () => {
  it("compensates nobody unless the case was upheld", async () => {
    for (const status of ["open", "under_review", "overturned", "closed"] as CaseStatus[]) {
      const { repository, saved } = buildFakeRepository([{ userId: "victim", gameRecordId: "g1" }]);

      const records = await new CompensationManager(repository).compensate(buildCase(status));

      assert.deepEqual(records, [], status);
      assert.equal(saved.length, 0, `${status} must write nothing`);
    }
  });

  it("looks only at the flagged games, and never at the suspect", async () => {
    const { repository, lookups } = buildFakeRepository([]);

    await new CompensationManager(repository).compensate(buildCase("upheld", ["g2", "g7"]));

    assert.deepEqual(lookups, [{ gameRecordIds: ["g2", "g7"], suspectUserId: "cheater" }]);
  });

  it("records a zero restoration with its reason when no rating was at stake", async () => {
    const { repository, saved } = buildFakeRepository([
      { userId: "victim", gameRecordId: "g1" },
      { userId: "other", gameRecordId: "g2", ratingPointsLost: 12 },
    ]);

    await new CompensationManager(repository).compensate(buildCase("upheld"));

    assert.equal(saved[0]!.ratingPointsRestored, 0);
    assert.match(saved[0]!.notes ?? "", /unrated/i);
    assert.equal(saved[1]!.ratingPointsRestored, 12);
    assert.equal(saved[1]!.notes, undefined);
  });
});
