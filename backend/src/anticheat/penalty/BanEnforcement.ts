/**
 * The play gate, checked at matchmaking entry.
 *
 * A ban blocks playing, not signing in — users keep their account, lessons and
 * history. Expiry is resolved here at read time, so a lapsed temporary ban stops
 * blocking with nothing to sweep.
 */

import { env } from "../../config/env.js";
import { prismaActionRepository, type ActionRepository } from "./actionRepository.js";
import { prismaPenaltyRepository, type PenaltyRepository } from "./penaltyRepository.js";
import type { AppliedPenalty } from "../types.js";

/** Null when the user may play. Returns the penalty itself so callers can cite it. */
export async function findBlockingPenalty(
  userId: string,
  repository: PenaltyRepository = prismaPenaltyRepository,
  actions: ActionRepository = prismaActionRepository
): Promise<AppliedPenalty | null> {
  if (!env.ANTICHEAT_ENABLED) return null;

  const active = await repository.findActivePenalties(userId);
  if (active.length === 0) return null;

  const blocking = await actions.findBlockingCodes();
  return active.find((penalty) => blocking.includes(penalty.action)) ?? null;
}
