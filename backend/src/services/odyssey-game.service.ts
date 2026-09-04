import { OdysseyGameRepository } from "../repositories/OdysseyGameRepository.js";
import { OdysseyGame } from "../models/odyssey/models/OdysseyGame.js";
import { OdysseyPlayer } from "../models/odyssey/models/OdysseyPlayer.js";
import type { EPlayerType } from "../models/odyssey/enums/EPlayerType.js";

export interface OdysseyGameSlotSummary {
  slotId: number;
  progressPercent: number;
  playtimeSeconds: number;
  updatedAt: Date;
}

/**
 * Coordinates Odyssey run persistence and the small pieces of flow every
 * node type shares (loading a slot, marking a node entered). Domain-specific
 * services (OdysseyBattleService, OdysseyMerchantService, ...) call into this
 * one rather than re-implementing "load the slot or fail" themselves.
 */
export class OdysseyGameService {
  static async getSlot(userId: string, slotId: number): Promise<OdysseyGame | null> {
    return OdysseyGameRepository.findBySlot(userId, slotId);
  }

  static async getAllSlotSummaries(userId: string): Promise<OdysseyGameSlotSummary[]> {
    const games = await OdysseyGameRepository.findAllByUser(userId);
    return games.map(game => ({
      slotId: game.slotId,
      progressPercent: game.calculateProgressPercent(),
      playtimeSeconds: game.playtimeSeconds,
      updatedAt: game.updatedAt,
    }));
  }

  /** Loads a slot or throws — the shared "not found" guard every other Odyssey service needs. */
  static async requireSlot(userId: string, slotId: number): Promise<OdysseyGame> {
    const game = await OdysseyGameRepository.findBySlot(userId, slotId);
    if (!game) {
      throw new Error(`No Odyssey run found for user ${userId}, slot ${slotId}.`);
    }
    return game;
  }

  /** Starts a brand-new run for a slot (overwrites any existing state for that slot). */
  static async startNewRun(userId: string, slotId: number): Promise<OdysseyGame> {
    const game = new OdysseyGame();
    game.userId = userId;
    game.slotId = slotId;
    game.reset(false); // sets every field to its default and generates a fresh map
    return OdysseyGameRepository.upsert(game);
  }

  static async selectCharacter(userId: string, slotId: number, type: EPlayerType): Promise<OdysseyGame> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    OdysseyPlayer.select(type, game); // no-ops silently for a locked/unknown type — the model owns that rule
    return OdysseyGameRepository.upsert(game);
  }

  /**
   * Marks a node as entered (updates currentNodeId). This is the common
   * first step before any node's own screen (battle/merchant/rest/puzzle)
   * opens — mirrors StoryModeMap.handleNodeClick setting currentNodeId
   * before switching views.
   */
  static async enterNode(userId: string, slotId: number, nodeId: number): Promise<OdysseyGame> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    if (!game.canEnterNode(nodeId)) {
      throw new Error(`Node ${nodeId} is not currently enterable for this run.`);
    }
    game.currentNodeId = nodeId;
    return OdysseyGameRepository.upsert(game);
  }

  static async resetRun(userId: string, slotId: number, keepProgress: boolean): Promise<OdysseyGame> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    game.reset(keepProgress);
    return OdysseyGameRepository.upsert(game);
  }

  /**
   * Marks an arbitrary node completed, for the one node type with no
   * domain-specific completion flow of its own: the Start node (id 0),
   * which the frontend always renders as an immediate battle but which
   * carries no monster/difficulty data here and so isn't an OdysseyBattleNode
   * — OdysseyBattleService.resolveOutcome can't be used for it. Every other
   * node type (battle/merchant/rest/puzzle) completes itself through its own
   * service; this exists only to cover that gap and keep completedNodes
   * accurate for canEnterNode's reachability gating past floor 1.
   */
  static async completeNode(userId: string, slotId: number, nodeId: number): Promise<OdysseyGame> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    game.completeNode(nodeId, false);
    return OdysseyGameRepository.upsert(game);
  }

  static async deleteSlot(userId: string, slotId: number): Promise<void> {
    await OdysseyGameRepository.delete(userId, slotId);
  }
}
