/**
 * The play gate, checked at matchmaking entry.
 *
 * A ban blocks playing, not signing in — users keep their account, lessons and
 * history. Expiry is resolved here at read time, so a lapsed temporary ban stops
 * blocking with nothing to sweep.
 */

import { env } from "../../config/env.js";
import { PolicyRegistry } from "../feedback/PolicyRegistry.js";
import { prismaPenaltyRepository, type PenaltyRepository } from "./penaltyRepository.js";
import type { AppliedPenalty, Situation } from "../types.js";

/** Matchmaking produces unrated queue games only — `rated: false` is hardcoded there. */
const QUEUE_SITUATION: Situation = { proficiency: "unknown", eventType: "unrated_game" };

/** Null when the user may play. Returns the penalty itself so callers can cite it. */
export async function findBlockingPenalty(
  userId: string,
  repository: PenaltyRepository = prismaPenaltyRepository
): Promise<AppliedPenalty | null> {
  if (!env.ANTICHEAT_ENABLED) return null;

  const blocking = new PolicyRegistry().getBlockingActions(QUEUE_SITUATION);
  const active = await repository.findActivePenalties(userId);

  return active.find((penalty) => blocking.includes(penalty.action)) ?? null;
}
