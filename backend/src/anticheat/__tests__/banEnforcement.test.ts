import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { findBlockingPenalty } from "../penalty/BanEnforcement.js";
import type { PenaltyRepository } from "../penalty/penaltyRepository.js";
import type { ActionRepository, PenaltyActionType } from "../penalty/actionRepository.js";
import { env } from "../../config/env.js";
import type { AppliedPenalty, PenaltyAction, Situation } from "../types.js";

const SITUATION: Situation = { proficiency: "unknown", eventType: "unrated_game" };

function buildRepositoryHolding(...actions: PenaltyAction[]): PenaltyRepository {
  const penalties: AppliedPenalty[] = actions.map((action, index) => ({
    penaltyId: `pen-${index}`,
    userId: "u1",
    action,
    level: 2,
    situation: SITUATION,
    appliedAt: new Date(),
    caseId: "case-1",
    reversed: false,
  }));

  return {
    savePenalty: async () => {
      throw new Error("unused");
    },
    findPenaltyById: async () => null,
    findActivePenalties: async () => penalties,
    findPenaltyHistory: async () => penalties,
    reversePenalty: async () => {
      throw new Error("unused");
    },
  };
}

/** Mirrors the seeded catalogue: only the two bans block play. */
const BLOCKING: readonly PenaltyAction[] = ["temporary_ban", "permanent_ban"];

const actionRepository: ActionRepository = {
  findActiveActions: async () => [],
  findActionByCode: async () => null as PenaltyActionType | null,
  findBlockingCodes: async () => BLOCKING,
};

/** env is read at call time, so tests flip it and restore it. */
async function withAntiCheatEnabled<T>(enabled: boolean, run: () => Promise<T>): Promise<T> {
  const previous = env.ANTICHEAT_ENABLED;
  (env as { ANTICHEAT_ENABLED: boolean }).ANTICHEAT_ENABLED = enabled;
  try {
    return await run();
  } finally {
    (env as { ANTICHEAT_ENABLED: boolean }).ANTICHEAT_ENABLED = previous;
  }
}

describe("findBlockingPenalty", () => {
  it("blocks on a ban", async () => {
    const blocking = await withAntiCheatEnabled(true, () =>
      findBlockingPenalty("u1", buildRepositoryHolding("temporary_ban"), actionRepository)
    );

    assert.equal(blocking?.action, "temporary_ban");
  });

  it("does not block on a penalty that is not a ban", async () => {
    const blocking = await withAntiCheatEnabled(true, () =>
      findBlockingPenalty(
        "u1",
        buildRepositoryHolding("warning", "strike", "restrict_from_rated_events"),
        actionRepository
      )
    );

    assert.equal(blocking, null);
  });

  it("blocks nothing while the anti-cheat system is disabled", async () => {
    const blocking = await withAntiCheatEnabled(false, () =>
      findBlockingPenalty("u1", buildRepositoryHolding("permanent_ban"), actionRepository)
    );

    assert.equal(blocking, null);
  });
});
