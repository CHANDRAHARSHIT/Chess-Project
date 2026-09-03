import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Request, Response } from "express";
import { requireArbiter } from "../../middleware/arbiter.middleware.js";
import { env } from "../../config/env.js";
import { CaseAccessError, CaseManager, CaseNotDecidedError } from "../review/CaseManager.js";
import type { CaseRepository } from "../review/caseRepository.js";
import type { ReviewCase } from "../types.js";

function runArbiterCheck(allowlist: string, email?: string) {
  const previous = env.ACS_ARBITER_EMAILS;
  (env as { ACS_ARBITER_EMAILS: string }).ACS_ARBITER_EMAILS = allowlist;

  const captured: { status?: number } = {};
  let passed = false;
  const res = {
    status(code: number) {
      captured.status = code;
      return this;
    },
    json() {
      return this;
    },
  };

  try {
    requireArbiter(
      { user: email ? { email } : undefined } as Request,
      res as unknown as Response,
      () => {
        passed = true;
      }
    );
  } finally {
    (env as { ACS_ARBITER_EMAILS: string }).ACS_ARBITER_EMAILS = previous;
  }

  return { passed, status: captured.status };
}

describe("requireArbiter", () => {
  it("denies everyone when the allowlist is unset", () => {
    const result = runArbiterCheck("", "anyone@x.test");

    assert.equal(result.passed, false);
    assert.equal(result.status, 403);
  });

  it("admits listed emails only, ignoring case", () => {
    const allowlist = "Arbiter@x.test, second@x.test";

    assert.equal(runArbiterCheck(allowlist, "arbiter@X.test").passed, true);
    assert.equal(runArbiterCheck(allowlist, "outsider@x.test").passed, false);
    assert.equal(runArbiterCheck(allowlist, undefined).passed, false);
  });
});

function buildRepositoryHolding(reviewCase: ReviewCase): CaseRepository {
  return {
    saveCase: async () => reviewCase,
    findCaseById: async () => reviewCase,
    findCases: async () => [reviewCase],
    findUnresolvedCaseForUser: async () => null,
    updateCase: async (_id, changes) => ({ ...reviewCase, ...changes }) as ReviewCase,
    countUpheldCases: async () => 0,
  };
}

function buildCase(overrides: Partial<ReviewCase> = {}): ReviewCase {
  return {
    caseId: "case-1",
    suspect: {
      userId: "suspect",
      ratingAtEvent: null,
      proficiency: "unknown",
      priorStrikeCount: 0,
      underHeightenedScrutiny: false,
    },
    situation: { proficiency: "unknown", eventType: "unrated_game" },
    status: "upheld",
    outcomes: [],
    evidence: [],
    flaggedGameRecordIds: ["g1"],
    affectedUsers: [],
    openedAt: new Date(),
    upheld: true,
    ...overrides,
  };
}

describe("CaseManager.submitAppeal", () => {
  it("refuses an appeal from anyone but the suspect", async () => {
    const manager = new CaseManager(buildRepositoryHolding(buildCase()));

    await assert.rejects(
      () => manager.submitAppeal("case-1", "someone-else", "I disagree."),
      CaseAccessError
    );
  });

  it("refuses an appeal before the case has been decided", async () => {
    const undecided = buildCase({ status: "open", upheld: undefined });
    const manager = new CaseManager(buildRepositoryHolding(undecided));

    await assert.rejects(
      () => manager.submitAppeal("case-1", "suspect", "I disagree."),
      CaseNotDecidedError
    );
  });
});
