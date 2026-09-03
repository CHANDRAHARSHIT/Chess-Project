import { OdysseyGameRepository } from "../repositories/OdysseyGameRepository.js";
import { OdysseyGameService } from "./odyssey-game.service.js";
import { getEngineMove, getLegalMoves } from "./odyssey-chess-engine.js";
import { OdysseyBattle } from "../models/odyssey/models/OdysseyBattle.js";
import { OdysseyBattleNode } from "../models/odyssey/models/OdysseyBattleNode.js";
import { OdysseyBattleRelic } from "../models/odyssey/models/OdysseyBattleRelic.js";
import type { OdysseyGame } from "../models/odyssey/models/OdysseyGame.js";
import type { OdysseyMonster } from "../models/odyssey/models/OdysseyMonster.js";
import { EBotCondition } from "../models/odyssey/enums/EBotCondition.js";
import { EBattleResult } from "../models/odyssey/enums/EBattleResult.js";
import type { EBattleEndReason } from "../models/odyssey/enums/EBattleEndReason.js";
import type { ERelicType } from "../models/odyssey/enums/ERelicType.js";
import type { ETimeDirection } from "../models/odyssey/enums/ETimeDirection.js";

/**
 * An OdysseyBattle's mid-battle state, serialized. Battles aren't persisted
 * to the database (only their outcome is, via resolveOutcome) — matching the
 * frontend, which only ever writes coins/relics/completedNodes to RunState
 * and keeps clocks/bot-conditions as component-local state for the fight's
 * duration. The caller (Controller/frontend) round-trips this snapshot with
 * every request instead of the server holding a live battle session.
 */
export interface OdysseyBattleSnapshot {
  playerInitialSeconds: number;
  enemyInitialSeconds: number;
  playerSeconds: number;
  enemySeconds: number;
  evalMovesRemaining: number;
  botConditions: { confused: number; relaxed: number; distracted: number };
}

function dehydrate(battle: OdysseyBattle): OdysseyBattleSnapshot {
  return {
    playerInitialSeconds: battle.playerInitialSeconds,
    enemyInitialSeconds: battle.enemyInitialSeconds,
    playerSeconds: battle.playerSeconds,
    enemySeconds: battle.enemySeconds,
    evalMovesRemaining: battle.evalMovesRemaining,
    botConditions: {
      confused: battle.botConditions.get(EBotCondition.Confused),
      relaxed: battle.botConditions.get(EBotCondition.Relaxed),
      distracted: battle.botConditions.get(EBotCondition.Distracted),
    },
  };
}

/** Rebuilds an OdysseyBattle from a node + a previously-dehydrated snapshot. */
function hydrate(node: OdysseyBattleNode, snapshot: OdysseyBattleSnapshot): OdysseyBattle {
  const battle = new OdysseyBattle(node);
  battle.playerInitialSeconds = snapshot.playerInitialSeconds;
  battle.enemyInitialSeconds = snapshot.enemyInitialSeconds;
  battle.playerSeconds = snapshot.playerSeconds;
  battle.enemySeconds = snapshot.enemySeconds;
  battle.evalMovesRemaining = snapshot.evalMovesRemaining;
  // OdysseyBotConditions only exposes relative `increase`, no direct setter —
  // starting from a fresh (all-zero) instance, increasing by the stored
  // value reproduces it exactly.
  battle.botConditions.increase(EBotCondition.Confused, snapshot.botConditions.confused);
  battle.botConditions.increase(EBotCondition.Relaxed, snapshot.botConditions.relaxed);
  battle.botConditions.increase(EBotCondition.Distracted, snapshot.botConditions.distracted);
  return battle;
}

function getBattleNode(game: OdysseyGame, nodeId: number): OdysseyBattleNode {
  const node = game.map.getNode(nodeId);
  if (!(node instanceof OdysseyBattleNode)) {
    throw new Error(`Node ${nodeId} is not a battle node.`);
  }
  return node;
}

export class OdysseyBattleService {
  /** Enters a battle node and returns a fresh snapshot for the caller to drive the fight with. */
  static async startBattle(
    userId: string,
    slotId: number,
    nodeId: number
  ): Promise<{ game: OdysseyGame; snapshot: OdysseyBattleSnapshot; monster: OdysseyMonster }> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    const node = getBattleNode(game, nodeId); // validated before mutating currentNodeId
    const savedGame = await OdysseyGameService.enterNode(userId, slotId, nodeId);
    const battle = new OdysseyBattle(node);
    return { game: savedGame, snapshot: dehydrate(battle), monster: battle.monster };
  }

  /** Applies a player-move trigger to the snapshot. No persistence — nothing here is stored state. */
  static async registerPlayerMove(
    userId: string,
    slotId: number,
    nodeId: number,
    snapshot: OdysseyBattleSnapshot,
    move: { isCheck: boolean; isCapture: boolean }
  ): Promise<OdysseyBattleSnapshot> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    const battle = hydrate(getBattleNode(game, nodeId), snapshot);
    battle.registerPlayerMove(move);
    return dehydrate(battle);
  }

  /** Computes the bot's move for the current position. No persistence — read-only computation + an engine call. */
  static async computeAiMove(
    userId: string,
    slotId: number,
    nodeId: number,
    snapshot: OdysseyBattleSnapshot,
    fen: string
  ): Promise<{ move: string; snapshot: OdysseyBattleSnapshot }> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    const battle = hydrate(getBattleNode(game, nodeId), snapshot);
    const { move } = await battle.computeAiMove(fen, getLegalMoves, getEngineMove);
    return { move, snapshot: dehydrate(battle) };
  }

  /**
   * Applies a relic's in-battle effect. This DOES persist — the relic's
   * charge count lives on the run, not the ephemeral battle.
   */
  static async applyChargeAction(
    userId: string,
    slotId: number,
    nodeId: number,
    snapshot: OdysseyBattleSnapshot,
    relicType: ERelicType,
    direction?: ETimeDirection
  ): Promise<{ game: OdysseyGame; snapshot: OdysseyBattleSnapshot }> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    const node = getBattleNode(game, nodeId);
    const relic = game.getRelic(relicType);
    if (!relic || !(relic instanceof OdysseyBattleRelic)) {
      throw new Error(`No usable battle relic of type ${relicType} for this run.`);
    }
    const battle = hydrate(node, snapshot);
    relic.applyInBattle(battle, game, direction); // consumes the charge on `game.relics` as a side effect
    const savedGame = await OdysseyGameRepository.upsert(game);
    return { game: savedGame, snapshot: dehydrate(battle) };
  }

  /**
   * Resolves the battle and persists its outcome: coins, and — on a boss
   * victory — journeyComplete/node completion. Mirrors the frontend's split
   * between StoryModeBattle (awards coins) and StoryModeMap
   * (appends to completedNodes) — both happen here since neither exists as
   * a separate persisted step server-side.
   */
  static async resolveOutcome(
    userId: string,
    slotId: number,
    nodeId: number,
    snapshot: OdysseyBattleSnapshot,
    endReason: EBattleEndReason,
    playerWon: boolean
  ): Promise<{ game: OdysseyGame; result: EBattleResult; coinsAwarded: number }> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    const node = getBattleNode(game, nodeId);
    const battle = hydrate(node, snapshot);
    const { result, coinsAwarded } = battle.resolveOutcome(endReason, playerWon, game);
    if (result === EBattleResult.Victory) {
      game.completeNode(nodeId, node.isBoss());
    }
    const savedGame = await OdysseyGameRepository.upsert(game);
    return { game: savedGame, result, coinsAwarded };
  }
}
