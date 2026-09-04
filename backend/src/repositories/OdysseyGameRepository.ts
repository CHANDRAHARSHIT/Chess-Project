import { prisma } from "../config/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { OdysseyGame } from "../models/odyssey/models/OdysseyGame.js";
import { OdysseyPlayer } from "../models/odyssey/models/OdysseyPlayer.js";
import { OdysseyMap } from "../models/odyssey/models/OdysseyMap.js";
import { OdysseyNode } from "../models/odyssey/models/OdysseyNode.js";
import { OdysseyBattleNode } from "../models/odyssey/models/OdysseyBattleNode.js";
import { OdysseyBossNode } from "../models/odyssey/models/OdysseyBossNode.js";
import { OdysseyPuzzleNode } from "../models/odyssey/models/OdysseyPuzzleNode.js";
import { OdysseyRelicFactory } from "../models/odyssey/models/OdysseyRelicFactory.js";
import { ENodeType } from "../models/odyssey/enums/ENodeType.js";
import type { EDifficulty } from "../models/odyssey/enums/EDifficulty.js";
import type { ERelicType } from "../models/odyssey/enums/ERelicType.js";

/** The JSON shape one OdysseyNode (of any subclass) is stored as in the `mapNodes` column. */
interface OdysseyNodeRow {
  id: number;
  type: ENodeType;
  label: string;
  x: number;
  y: number;
  edges: number[];
  description: string;
  difficulty?: EDifficulty; // present only for OdysseyBattleNode/OdysseyPuzzleNode
}

/** The JSON shape one OdysseyRelic is stored as in the `relics` column. */
interface OdysseyRelicRow {
  type: ERelicType;
  charges: number;
}

/** The subset of an OdysseyGame Prisma row this repository needs to convert into a model. */
interface OdysseyGamePersistedRow {
  id: string;
  userId: string;
  slotId: number;
  playerType: string | null;
  coins: number;
  relics: unknown;
  completedNodes: number[];
  currentNodeId: number;
  journeyComplete: boolean;
  mapNodes: unknown;
  playtimeSeconds: number;
  updatedAt: Date;
}

/**
 * Persists Odyssey (Story Mode) run state. All application-level database
 * access for OdysseyGame lives here — Controllers, Services, and the
 * OdysseyGame model itself must never query the database directly.
 */
export class OdysseyGameRepository {
  static async findBySlot(userId: string, slotId: number): Promise<OdysseyGame | null> {
    const row = await prisma.odysseyGame.findUnique({ where: { userId_slotId: { userId, slotId } } });
    return row ? OdysseyGameRepository.getModelUsingRow(row) : null;
  }

  /** All of a user's save slots (up to 3), ordered by slot number. */
  static async findAllByUser(userId: string): Promise<OdysseyGame[]> {
    const rows = await prisma.odysseyGame.findMany({ where: { userId }, orderBy: { slotId: "asc" } });
    return rows.map(row => OdysseyGameRepository.getModelUsingRow(row));
  }

  /** Creates the slot's row if none exists for (userId, slotId), otherwise updates it. Returns the persisted state. */
  static async upsert(game: OdysseyGame): Promise<OdysseyGame> {
    const data = OdysseyGameRepository.getRowDataUsingModel(game);
    const row = await prisma.odysseyGame.upsert({
      where: { userId_slotId: { userId: game.userId, slotId: game.slotId } },
      create: { userId: game.userId, slotId: game.slotId, ...data },
      update: data,
    });
    return OdysseyGameRepository.getModelUsingRow(row);
  }

  /** Permanently deletes a save slot. No-op if it doesn't exist. */
  static async delete(userId: string, slotId: number): Promise<void> {
    await prisma.odysseyGame.deleteMany({ where: { userId, slotId } });
  }

  /**
   * Converts a persisted row into an OdysseyGame instance, reconstructing
   * the correct OdysseyRelic and OdysseyNode subclasses rather than
   * leaving them as plain JSON objects.
   */
  static getModelUsingRow(row: OdysseyGamePersistedRow): OdysseyGame {
    const game = new OdysseyGame();
    game.id = row.id;
    game.userId = row.userId;
    game.slotId = row.slotId;
    game.coins = row.coins;
    game.relics = (row.relics as OdysseyRelicRow[]).map(relicRow => OdysseyRelicFactory.create(relicRow.type, relicRow.charges));
    game.completedNodes = row.completedNodes;
    game.currentNodeId = row.currentNodeId;
    game.journeyComplete = row.journeyComplete;
    game.map = new OdysseyMap((row.mapNodes as OdysseyNodeRow[]).map(OdysseyGameRepository.nodeFromRow));
    game.playtimeSeconds = row.playtimeSeconds;
    game.updatedAt = row.updatedAt;
    game.player = row.playerType
      ? (OdysseyPlayer.getAvailable(game).find(candidate => candidate.type === row.playerType) ?? null)
      : null;
    return game;
  }

  /** Converts an OdysseyGame instance into the plain fields Prisma needs for a create/update. */
  private static getRowDataUsingModel(game: OdysseyGame) {
    return {
      playerType: game.player?.type ?? null,
      coins: game.coins,
      relics: game.relics.map((relic): OdysseyRelicRow => ({ type: relic.type, charges: relic.charges })) as unknown as Prisma.InputJsonValue,
      completedNodes: game.completedNodes,
      currentNodeId: game.currentNodeId,
      journeyComplete: game.journeyComplete,
      mapNodes: game.map.nodes.map(OdysseyGameRepository.nodeToRow) as unknown as Prisma.InputJsonValue,
      playtimeSeconds: game.playtimeSeconds,
    };
  }

  private static nodeToRow(node: OdysseyNode): OdysseyNodeRow {
    const difficulty =
      node instanceof OdysseyBattleNode ? node.difficulty : node instanceof OdysseyPuzzleNode ? node.difficulty : undefined;
    return {
      id: node.id,
      type: node.type,
      label: node.label,
      x: node.x,
      y: node.y,
      edges: node.edges,
      description: node.description,
      difficulty,
    };
  }

  private static nodeFromRow(row: OdysseyNodeRow): OdysseyNode {
    switch (row.type) {
      case ENodeType.Enemy:
      case ENodeType.Elite:
        return new OdysseyBattleNode(row.id, row.type, row.label, row.x, row.y, row.edges, row.description, row.difficulty!);
      case ENodeType.Boss:
        return new OdysseyBossNode(row.id, row.label, row.x, row.y, row.edges, row.description);
      case ENodeType.Puzzle:
        return new OdysseyPuzzleNode(row.id, row.label, row.x, row.y, row.edges, row.description, row.difficulty!);
      case ENodeType.Start:
      case ENodeType.Rest:
      case ENodeType.Merchant:
        return new OdysseyNode(row.id, row.type, row.label, row.x, row.y, row.edges, row.description);
      default: {
        const exhaustive: never = row.type;
        throw new Error(`Unknown node type in stored map: ${exhaustive}`);
      }
    }
  }
}
