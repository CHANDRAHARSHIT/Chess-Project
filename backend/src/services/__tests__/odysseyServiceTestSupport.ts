import { randomUUID } from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { OdysseyGameService } from "../odyssey-game.service.js";
import { OdysseyGameRepository } from "../../repositories/OdysseyGameRepository.js";
import type { OdysseyGame } from "../../models/odyssey/models/OdysseyGame.js";
import type { OdysseyNode } from "../../models/odyssey/models/OdysseyNode.js";
import type { ENodeType } from "../../models/odyssey/enums/ENodeType.js";

/**
 * Shared helpers for the Odyssey Service layer's integration tests. These
 * services coordinate real persistence (via OdysseyGameRepository) and, for
 * the battle service, a real chess engine — so like the Repository tests,
 * these run against the local Postgres instance with a throwaway User row,
 * never mocks.
 */

export async function createTestUser(label: string): Promise<string> {
  const user = await prisma.user.create({
    data: { email: `odyssey-service-test-${label}-${randomUUID()}@example.test` },
  });
  return user.id;
}

export async function deleteTestUser(userId: string): Promise<void> {
  await prisma.user.delete({ where: { id: userId } });
}

function findPredecessorOf(game: OdysseyGame, targetId: number): number {
  const predecessor = game.map.nodes.find(node => node.isAdjacentTo(targetId));
  if (!predecessor) {
    throw new Error(`No predecessor found for node ${targetId} in the generated map (unexpected).`);
  }
  return predecessor.id;
}

const MAX_MAP_GENERATION_ATTEMPTS = 10;

/**
 * Starts a fresh run and forces a node of `nodeType` to be enterable, by
 * marking a real predecessor of it (found from the generated map's own
 * edges) as completed/current. The map is unseeded random generation (same
 * as production), so this retries a few fresh runs if a given type happens
 * not to appear anywhere on that particular map.
 */
export async function makeGameWithEnterableNode(
  userId: string,
  slotId: number,
  nodeType: ENodeType
): Promise<{ game: OdysseyGame; node: OdysseyNode }> {
  for (let attempt = 0; attempt < MAX_MAP_GENERATION_ATTEMPTS; attempt++) {
    const freshGame = await OdysseyGameService.startNewRun(userId, slotId);
    const node = freshGame.map.nodes.find(n => n.type === nodeType);
    if (!node) {
      continue;
    }
    const predecessorId = findPredecessorOf(freshGame, node.id);
    freshGame.completedNodes = [predecessorId];
    freshGame.currentNodeId = predecessorId;
    const game = await OdysseyGameRepository.upsert(freshGame);
    return { game, node };
  }
  throw new Error(`Could not generate a map containing a ${nodeType} node after ${MAX_MAP_GENERATION_ATTEMPTS} attempts.`);
}

/** Same idea, but for the single boss node (always present, never matched by type search retries). */
export async function makeGameWithEnterableBoss(userId: string, slotId: number): Promise<{ game: OdysseyGame; node: OdysseyNode }> {
  const freshGame = await OdysseyGameService.startNewRun(userId, slotId);
  const node = freshGame.map.nodes.find(n => n.isBoss())!;
  const predecessorId = findPredecessorOf(freshGame, node.id);
  freshGame.completedNodes = [predecessorId];
  freshGame.currentNodeId = predecessorId;
  const game = await OdysseyGameRepository.upsert(freshGame);
  return { game, node };
}
