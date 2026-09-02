import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { EscalationLadder } from "../penalty/EscalationLadder.js";
import {
  PenaltyManager,
  PenaltyNotFoundError,
  UnappealablePenaltyError,
} from "../penalty/PenaltyManager.js";
import type { NewPenaltyInput, PenaltyRepository } from "../penalty/penaltyRepository.js";
import { PolicyRegistry } from "../feedback/PolicyRegistry.js";
import { CaseManager } from "../review/CaseManager.js";
import type { CaseRepository } from "../review/caseRepository.js";
import type {
  AppliedPenalty,
  DetectionOutcome,
  EscalationLevel,
  EventType,
  PenaltyAction,
  Situation,
} from "../types.js";

const ALL_ACTIONS: readonly PenaltyAction[] = [
  "increase_monitoring",
  "warning",
  "strike",
  "restrict_from_prize_events",
  "restrict_from_rated_events",
  "suspend_from_current_event",
  "temporary_ban",
  "permanent_ban",
];

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

function buildManager(upheldCount = 0) {
  const policy = new PolicyRegistry();
  const ladder = new EscalationLadder(policy, new CaseManager(buildFakeCaseRepository(upheldCount)));
  const repository = buildFakePenaltyRepository();
  return { manager: new PenaltyManager(policy, ladder, repository), repository, ladder, policy };
}

describe("the placeholder interlock", () => {
  it("puts every action's certainty bar above the uncalibrated ceiling", () => {
    const policy = new PolicyRegistry();
    const ceiling = policy.getCertaintyPolicy(SITUATION).uncalibratedCeiling;

    for (const action of ALL_ACTIONS) {
      const threshold = policy.getCertaintyThreshold(action, SITUATION);
      assert.ok(
        threshold > ceiling,
        `${action} bar ${threshold} must exceed the ${ceiling} ceiling`
      );
    }
  });

  it("cannot apply any action automatically at the capped certainty", () => {
    const { manager, policy } = buildManager();
    const ceiling = policy.getCertaintyPolicy(SITUATION).uncalibratedCeiling;

    for (const action of ALL_ACTIONS) {
      assert.equal(manager.canApply(action, ceiling, SITUATION), false, action);
    }
  });

  it("selects no actions from a placeholder-driven detection at any level", async () => {
    const { manager } = buildManager();

    for (const level of [0, 1, 2, 3] as EscalationLevel[]) {
      assert.deepEqual(await manager.determineActions(buildOutcome(), level), []);
    }
  });
});

describe("severity does not vary by Situation", () => {
  it("uses the same certainty bar for every event type", () => {
    const policy = new PolicyRegistry();

    for (const action of ALL_ACTIONS) {
      const thresholds = ALL_EVENT_TYPES.map((eventType) =>
        policy.getCertaintyThreshold(action, { proficiency: "unknown", eventType })
      );
      assert.equal(
        new Set(thresholds).size,
        1,
        `${action} must not have a softer bar in any Situation: ${thresholds.join(", ")}`
      );
    }
  });

  it("offers the same actions at a level for every event type", () => {
    const { ladder } = buildManager();

    for (const level of [0, 1, 2, 3] as EscalationLevel[]) {
      const actionSets = ALL_EVENT_TYPES.map((eventType) =>
        ladder.actionsForLevel(level, { proficiency: "unknown", eventType }).join(",")
      );
      assert.equal(new Set(actionSets).size, 1, `level ${level} must not vary by event type`);
    }
  });

  it("selects identical actions across event types once certainty is calibrated", async () => {
    const { manager } = buildManager();
    const selections = await Promise.all(
      ALL_EVENT_TYPES.map(async (eventType) => {
        const situation: Situation = { proficiency: "unknown", eventType };
        const outcome = buildOutcome({ certainty: 0.9, situation });
        return (await manager.determineActions(outcome, 2)).join(",");
      })
    );

    assert.equal(new Set(selections).size, 1, `selections diverged: ${selections.join(" | ")}`);
  });
});

describe("PenaltyManager.determineActions", () => {
  it("selects only the actions the certainty clears", async () => {
    const { manager } = buildManager();
    const actions = await manager.determineActions(buildOutcome({ certainty: 0.6 }), 2);

    assert.deepEqual(actions, ["strike"]);
  });

  it("selects nothing when detection did not fire", async () => {
    const { manager } = buildManager();
    const outcome = buildOutcome({ detected: false, certainty: 1 });

    assert.deepEqual(await manager.determineActions(outcome, 3), []);
  });

  it("reaches a permanent ban only at the top level and near-total certainty", async () => {
    const { manager } = buildManager();

    assert.deepEqual(await manager.determineActions(buildOutcome({ certainty: 1 }), 3), [
      "permanent_ban",
    ]);
    assert.deepEqual(await manager.determineActions(buildOutcome({ certainty: 0.9 }), 3), []);
  });
});

describe("PenaltyManager.apply", () => {
  it("refuses to apply a penalty with no case behind it", async () => {
    const { manager } = buildManager();

    await assert.rejects(
      () => manager.apply("u1", "warning", "   ", SITUATION),
      UnappealablePenaltyError
    );
  });

  it("applies on arbiter authority regardless of the certainty bars", async () => {
    const { manager, repository } = buildManager();

    const penalty = await manager.apply("u1", "permanent_ban", "case-1", SITUATION);

    assert.equal(penalty.action, "permanent_ban");
    assert.equal(penalty.caseId, "case-1");
    assert.equal(repository.saved.length, 1);
  });

  it("gives a temporary ban an expiry and a permanent ban none", async () => {
    const { manager } = buildManager();

    const temporary = await manager.apply("u1", "temporary_ban", "case-1", SITUATION);
    const permanent = await manager.apply("u1", "permanent_ban", "case-1", SITUATION);

    assert.ok(temporary.expiresAt instanceof Date);
    assert.ok(temporary.expiresAt!.getTime() > Date.now());
    assert.equal(permanent.expiresAt, undefined);
  });

  it("stamps the penalty with the level derived from upheld cases", async () => {
    const { manager } = buildManager(2);

    const penalty = await manager.apply("u1", "strike", "case-1", SITUATION);

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
    const penalty = await manager.apply("u1", "temporary_ban", "case-1", SITUATION);

    const reversed = await manager.reverse(penalty.penaltyId, "Appeal upheld.");

    assert.equal(reversed.reversed, true);
    assert.deepEqual(await manager.getActivePenalties("u1"), []);
    assert.equal((await manager.getPenaltyHistory("u1")).length, 1, "history keeps the record");
  });

  it("is safe to call twice", async () => {
    const { manager } = buildManager();
    const penalty = await manager.apply("u1", "warning", "case-1", SITUATION);

    await manager.reverse(penalty.penaltyId, "Appeal upheld.");
    const again = await manager.reverse(penalty.penaltyId, "Appeal upheld.");

    assert.equal(again.reversed, true);
  });

  it("rejects an unknown penalty id", async () => {
    const { manager } = buildManager();

    await assert.rejects(() => manager.reverse("nope", "reason"), PenaltyNotFoundError);
  });
});
