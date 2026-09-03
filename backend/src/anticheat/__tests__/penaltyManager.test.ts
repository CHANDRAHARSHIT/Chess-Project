import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { EscalationLadder } from "../penalty/EscalationLadder.js";
import {
  PenaltyManager,
  PenaltyNotFoundError,
  UnappealablePenaltyError,
} from "../penalty/PenaltyManager.js";
import type { NewPenaltyInput, PenaltyRepository } from "../penalty/penaltyRepository.js";
import type { ActionRepository, PenaltyActionType } from "../penalty/actionRepository.js";
import { PolicyRegistry } from "../feedback/PolicyRegistry.js";
import { CaseManager } from "../review/CaseManager.js";
import type { CaseRepository } from "../review/caseRepository.js";
import type {
  AppliedPenalty,
  DetectionOutcome,
  EscalationLevel,
  EventType,
  Situation,
} from "../types.js";

const ALL_EVENT_TYPES: readonly EventType[] = [
  "unrated_game",
  "rated_game",
  "tournament_no_prize",
  "tournament_with_prize",
];

const SITUATION: Situation = { proficiency: "unknown", eventType: "unrated_game" };

function buildOutcome(overrides: Partial<DetectionOutcome> = {}): DetectionOutcome {
  return {
    windowId: "w1",
    suspect: {
      userId: "u1",
      ratingAtEvent: null,
      proficiency: "unknown",
      priorStrikeCount: 0,
      underHeightenedScrutiny: false,
    },
    situation: SITUATION,
    results: [],
    totalScore: 500,
    threshold: 100,
    detected: true,
    flaggedGameRecordIds: ["g1", "g2", "g3"],
    certainty: 0.2,
    evaluatedAt: new Date(),
    ...overrides,
  };
}

function buildFakePenaltyRepository(): PenaltyRepository & { saved: NewPenaltyInput[] } {
  const penalties: AppliedPenalty[] = [];
  const saved: NewPenaltyInput[] = [];
  let nextId = 1;

  return {
    saved,

    async savePenalty(input: NewPenaltyInput) {
      saved.push(input);
      const penalty: AppliedPenalty = {
        penaltyId: `pen-${nextId++}`,
        userId: input.userId,
        action: input.action,
        level: input.level,
        situation: input.situation,
        appliedAt: new Date(),
        ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
        caseId: input.caseId,
        reversed: false,
      };
      penalties.push(penalty);
      return penalty;
    },

    async findPenaltyById(penaltyId) {
      return penalties.find((p) => p.penaltyId === penaltyId) ?? null;
    },

    async findActivePenalties(userId) {
      const now = Date.now();
      return penalties.filter(
        (p) =>
          p.userId === userId &&
          !p.reversed &&
          (p.expiresAt === undefined || p.expiresAt.getTime() > now)
      );
    },

    async findPenaltyHistory(userId) {
      return penalties.filter((p) => p.userId === userId);
    },

    async reversePenalty(penaltyId, _reason) {
      const index = penalties.findIndex((p) => p.penaltyId === penaltyId);
      penalties[index] = { ...penalties[index]!, reversed: true };
      return penalties[index]!;
    },
  };
}

/** Case repository stubbed down to the one method the ladder actually reads. */
function buildFakeCaseRepository(upheldCount: number): CaseRepository {
  return {
    saveCase: async () => {
      throw new Error("unused");
    },
    findCaseById: async () => null,
    findCases: async () => [],
    findUnresolvedCaseForUser: async () => null,
    updateCase: async () => {
      throw new Error("unused");
    },
    countUpheldCases: async () => upheldCount,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Mirrors the seeded catalogue for the two implemented actions. */
function buildFakeActionRepository(): ActionRepository {
  const catalogue: Record<string, PenaltyActionType> = {
    temporary_ban: {
      code: "temporary_ban",
      label: "Temporary Ban",
      description: "",
      blocksPlay: true,
      defaultDurationMs: 30 * DAY_MS,
      isImplemented: true,
      isActive: true,
      sortOrder: 7,
    },
    permanent_ban: {
      code: "permanent_ban",
      label: "Permanent Ban",
      description: "",
      blocksPlay: true,
      defaultDurationMs: null,
      isImplemented: true,
      isActive: true,
      sortOrder: 8,
    },
  };

  return {
    findActiveActions: async () => Object.values(catalogue),
    findActionByCode: async (code) => catalogue[code] ?? null,
    findBlockingCodes: async () => ["temporary_ban", "permanent_ban"],
  };
}

function buildManager(upheldCount = 0) {
  const policy = new PolicyRegistry();
  const ladder = new EscalationLadder(policy, new CaseManager(buildFakeCaseRepository(upheldCount)));
  const repository = buildFakePenaltyRepository();
  const manager = new PenaltyManager(policy, ladder, repository, buildFakeActionRepository());
  return { manager, repository, ladder, policy };
}

describe("severity does not vary by Situation", () => {
  it("selects identical actions for every event type", async () => {
    const { manager } = buildManager();
    const selections = await Promise.all(
      ALL_EVENT_TYPES.map(async (eventType) => {
        const situation: Situation = { proficiency: "unknown", eventType };
        return (await manager.determineActions(buildOutcome({ situation }), 2)).join(",");
      })
    );

    assert.equal(new Set(selections).size, 1, `selections diverged: ${selections.join(" | ")}`);
  });
});

describe("PenaltyManager.determineActions", () => {
  it("selects nothing when detection did not fire", async () => {
    const { manager } = buildManager();

    assert.deepEqual(await manager.determineActions(buildOutcome({ detected: false }), 3), []);
  });

  it("escalates from a temporary to a permanent ban with repeat offences", async () => {
    const { manager } = buildManager();
    const forLevel = async (level: EscalationLevel) =>
      (await manager.determineActions(buildOutcome(), level)).join(",");

    assert.equal(await forLevel(0), "temporary_ban", "first offence");
    assert.equal(await forLevel(1), "temporary_ban", "second offence");
    assert.equal(await forLevel(2), "permanent_ban", "third offence");
    assert.equal(await forLevel(3), "permanent_ban");
  });
});

describe("PenaltyManager.apply", () => {
  it("refuses to apply a penalty with no case behind it", async () => {
    const { manager } = buildManager();

    await assert.rejects(
      () => manager.apply("u1", "temporary_ban", "   ", SITUATION, 0),
      UnappealablePenaltyError
    );
  });

  it("applies the action it is given", async () => {
    const { manager, repository } = buildManager();

    const penalty = await manager.apply("u1", "permanent_ban", "case-1", SITUATION, 2);

    assert.equal(penalty.action, "permanent_ban");
    assert.equal(penalty.caseId, "case-1");
    assert.equal(repository.saved.length, 1);
  });

  it("gives a temporary ban an expiry and a permanent ban none", async () => {
    const { manager } = buildManager();

    const temporary = await manager.apply("u1", "temporary_ban", "case-1", SITUATION, 0);
    const permanent = await manager.apply("u1", "permanent_ban", "case-1", SITUATION, 2);

    assert.ok(temporary.expiresAt instanceof Date);
    assert.ok(temporary.expiresAt!.getTime() > Date.now());
    assert.equal(permanent.expiresAt, undefined);
  });

  it("stamps the penalty with the level derived from upheld cases", async () => {
    const { manager } = buildManager(2);

    const penalty = await manager.apply("u1", "permanent_ban", "case-1", SITUATION, 2);

    assert.equal(penalty.level, 2);
  });
});

describe("EscalationLadder derives the level from upheld cases", () => {
  it("stays at level 0 until a case is upheld", async () => {
    const { ladder } = buildManager(0);

    assert.equal(await ladder.getLevel("u1", SITUATION), 0);
    assert.equal(await ladder.isUnderHeightenedScrutiny("u1", SITUATION), false);
  });

  it("rises one level per upheld case and caps at 3", async () => {
    for (const [upheld, expected] of [
      [1, 1],
      [2, 2],
      [3, 3],
      [9, 3],
    ] as const) {
      const { ladder } = buildManager(upheld);
      assert.equal(await ladder.getLevel("u1", SITUATION), expected, `${upheld} upheld`);
    }
  });
});

describe("PenaltyManager.reverse", () => {
  it("reverses an applied penalty and drops it from the active set", async () => {
    const { manager } = buildManager();
    const penalty = await manager.apply("u1", "temporary_ban", "case-1", SITUATION, 0);

    const reversed = await manager.reverse(penalty.penaltyId, "Appeal upheld.");

    assert.equal(reversed.reversed, true);
    assert.deepEqual(await manager.getActivePenalties("u1"), []);
    assert.equal((await manager.getPenaltyHistory("u1")).length, 1, "history keeps the record");
  });

  it("is safe to call twice", async () => {
    const { manager } = buildManager();
    const penalty = await manager.apply("u1", "temporary_ban", "case-1", SITUATION, 0);

    await manager.reverse(penalty.penaltyId, "Appeal upheld.");
    const again = await manager.reverse(penalty.penaltyId, "Appeal upheld.");

    assert.equal(again.reversed, true);
  });

  it("rejects an unknown penalty id", async () => {
    const { manager } = buildManager();

    await assert.rejects(() => manager.reverse("nope", "reason"), PenaltyNotFoundError);
  });
});
