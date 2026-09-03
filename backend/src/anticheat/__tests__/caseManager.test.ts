import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  CaseAccessError,
  CaseAlreadyResolvedError,
  CaseManager,
  CaseNotFoundError,
} from "../review/CaseManager.js";
import { collectEvidence } from "../review/caseRepository.js";
import type { CaseChanges, CaseRepository, NewCaseInput } from "../review/caseRepository.js";
import { UNRESOLVED_CASE_STATUSES } from "../types.js";
import type { CaseStatus, DetectionOutcome, ReviewCase, Situation, Suspect } from "../types.js";

const SITUATION: Situation = { proficiency: "unknown", eventType: "unrated_game" };

function buildSuspect(userId = "u1"): Suspect {
  return {
    userId,
    ratingAtEvent: null,
    proficiency: "unknown",
    priorStrikeCount: 0,
    underHeightenedScrutiny: false,
  };
}

function buildOutcome(overrides: Partial<DetectionOutcome> = {}): DetectionOutcome {
  return {
    windowId: "w1",
    suspect: buildSuspect(),
    situation: SITUATION,
    results: [
      { checkId: "accuracy", score: 80, confidence: 1, evidence: ["Flagged in 3 of 10 games."] },
    ],
    totalScore: 120,
    threshold: 100,
    detected: true,
    flaggedGameRecordIds: ["g1", "g2"],
    certainty: 0.2,
    evaluatedAt: new Date("2026-09-02T10:00:00Z"),
    ...overrides,
  };
}

/** In-memory stand-in for the Prisma repository, so these tests need no database. */
function buildFakeRepository(): CaseRepository & { cases: ReviewCase[] } {
  const cases: ReviewCase[] = [];
  let nextId = 1;

  return {
    cases,

    async saveCase(input: NewCaseInput): Promise<ReviewCase> {
      const reviewCase: ReviewCase = {
        caseId: `case-${nextId++}`,
        suspect: buildSuspect(input.userId),
        situation: input.situation,
        status: "open",
        outcomes: [input.outcome],
        evidence: collectEvidence([input.outcome]),
        flaggedGameRecordIds: [...input.outcome.flaggedGameRecordIds],
        affectedUsers: [],
        openedAt: new Date(),
      };
      cases.push(reviewCase);
      return reviewCase;
    },

    async findCaseById(caseId) {
      return cases.find((c) => c.caseId === caseId) ?? null;
    },

    async findCases(status?: CaseStatus) {
      return status ? cases.filter((c) => c.status === status) : cases;
    },

    async findUnresolvedCaseForUser(userId) {
      return (
        cases.find(
          (c) => c.suspect.userId === userId && UNRESOLVED_CASE_STATUSES.includes(c.status)
        ) ?? null
      );
    },

    async updateCase(caseId, changes: CaseChanges) {
      const index = cases.findIndex((c) => c.caseId === caseId);
      const updated = { ...cases[index]!, ...changes } as ReviewCase;
      cases[index] = updated;
      return updated;
    },

    async countUpheldCases(userId) {
      return cases.filter((c) => c.suspect.userId === userId && c.upheld === true).length;
    },
  };
}

describe("CaseManager.openCase", () => {
  it("opens a case from a detection outcome", async () => {
    const repository = buildFakeRepository();
    const reviewCase = await new CaseManager(repository).openCase(buildSuspect(), buildOutcome());

    assert.equal(reviewCase.status, "open");
    assert.equal(reviewCase.outcomes.length, 1);
    assert.deepEqual(reviewCase.flaggedGameRecordIds, ["g1", "g2"]);
    assert.equal(repository.cases.length, 1);
  });

  it("appends a later outcome to the open case instead of opening a second one", async () => {
    const repository = buildFakeRepository();
    const manager = new CaseManager(repository);

    await manager.openCase(buildSuspect(), buildOutcome());
    const reviewCase = await manager.openCase(
      buildSuspect(),
      buildOutcome({
        windowId: "w2",
        totalScore: 300,
        flaggedGameRecordIds: ["g2", "g3"],
        results: [
          { checkId: "engine_streak", score: 90, confidence: 1, evidence: ["Second detection."] },
        ],
      })
    );

    assert.equal(repository.cases.length, 1, "must not open a second case");
    assert.equal(reviewCase.outcomes.length, 2, "the later outcome must not be discarded");
    assert.deepEqual(reviewCase.flaggedGameRecordIds, ["g1", "g2", "g3"], "flagged games merge");
    assert.ok(reviewCase.evidence.includes("Second detection."));
  });

  it("opens a fresh case once the previous one is resolved", async () => {
    const repository = buildFakeRepository();
    const manager = new CaseManager(repository);

    const first = await manager.openCase(buildSuspect(), buildOutcome());
    await manager.recordDecision({
      caseId: first.caseId,
      decidedBy: "admin@x.test",
      upheld: false,
      confidence: 0.9,
      reasoning: "Explained by opening preparation.",
      decidedAt: new Date(),
    });
    await manager.openCase(buildSuspect(), buildOutcome({ windowId: "w2" }));

    assert.equal(repository.cases.length, 2);
  });

});

describe("CaseManager decisions", () => {
  it("records an upheld decision and counts it towards escalation", async () => {
    const repository = buildFakeRepository();
    const manager = new CaseManager(repository);
    const opened = await manager.openCase(buildSuspect(), buildOutcome());

    const resolved = await manager.recordDecision({
      caseId: opened.caseId,
      decidedBy: "admin@x.test",
      upheld: true,
      confidence: 0.95,
      reasoning: "Engine correlation across three games.",
      decidedAt: new Date("2026-09-03T00:00:00Z"),
    });

    assert.equal(resolved.status, "upheld");
    assert.equal(resolved.upheld, true);
    assert.equal(await manager.countUpheldCases("u1"), 1);
  });

  it("refuses to decide a case twice", async () => {
    const repository = buildFakeRepository();
    const manager = new CaseManager(repository);
    const opened = await manager.openCase(buildSuspect(), buildOutcome());
    const decision = {
      caseId: opened.caseId,
      decidedBy: "admin@x.test",
      upheld: true,
      confidence: 0.9,
      reasoning: "Upheld.",
      decidedAt: new Date(),
    };

    await manager.recordDecision(decision);

    await assert.rejects(() => manager.recordDecision(decision), CaseAlreadyResolvedError);
  });

  it("rejects an unknown case id", async () => {
    const manager = new CaseManager(buildFakeRepository());

    await assert.rejects(() => manager.closeCase("nope", "n/a"), CaseNotFoundError);
  });
});

describe("CaseManager.submitSuspectStatement", () => {
  it("accepts a statement from the suspect", async () => {
    const repository = buildFakeRepository();
    const manager = new CaseManager(repository);
    const opened = await manager.openCase(buildSuspect("u1"), buildOutcome());

    const updated = await manager.submitSuspectStatement(opened.caseId, "u1", "I was streaming.");

    assert.equal(updated.suspectStatement, "I was streaming.");
  });

  it("refuses a statement from anyone else", async () => {
    const repository = buildFakeRepository();
    const manager = new CaseManager(repository);
    const opened = await manager.openCase(buildSuspect("u1"), buildOutcome());

    await assert.rejects(
      () => manager.submitSuspectStatement(opened.caseId, "someone-else", "Ban them."),
      CaseAccessError
    );
  });
});
