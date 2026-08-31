import { OdysseyBotConditions } from "./OdysseyBotConditions.js";
import { EBattleEndReason } from "../enums/EBattleEndReason.js";
import { EBattleResult } from "../enums/EBattleResult.js";
import type { OdysseyBattleNode } from "./OdysseyBattleNode.js";
import type { OdysseyMonster } from "./OdysseyMonster.js";
import type { OdysseyPlayer } from "./OdysseyPlayer.js";

/**
 * A live battle session opened against one OdysseyBattleNode (or
 * OdysseyBossNode). Relic effects no longer live here — see
 * OdysseyBattleRelic.applyInBattle — this class only tracks what the
 * battle itself owns: clocks and bot conditions.
 */
export class OdysseyBattle {
  readonly node: OdysseyBattleNode;
  readonly monster: OdysseyMonster;
  readonly botConditions: OdysseyBotConditions;

  playerInitialSeconds: number;
  enemyInitialSeconds: number;
  playerSeconds: number;
  enemySeconds: number;
  evalMovesRemaining: number;

  /**
   * Sets clocks by difficulty tier (StoryModeBattle, exact values):
   *   player: Master->180s, Advanced->300s, Intermediate->420s, Easy->480s, Beginner(default)->600s
   *   enemy:  Master->120s, Advanced->90s,  Beginner-Intermediate(default)->60s
   */
  constructor(node: OdysseyBattleNode) {
    throw new Error("Not implemented");
  }

  /**
   * Applies the player-move triggers to botConditions (each clamped to
   * [0,100] by OdysseyBotConditions.increase): +15 Confused if the move
   * gives check, +20 Distracted if the move is a capture (including en
   * passant), +10 Relaxed only if the move is neither a check nor a capture.
   */
  registerPlayerMove(move: { isCheck: boolean; isCapture: boolean }): void {
    throw new Error("Not implemented");
  }

  /**
   * Computes the bot's move, honoring active conditions (each consumed
   * exactly once per turn via botConditions.consume(), regardless of
   * whether it triggered):
   *   Confused >= 100  -> 50% chance to play a uniformly-random legal move
   *                        instead of the engine's best move
   *   Relaxed  >= 100  -> engine called at EDifficulty.Beginner for this
   *                        move only, regardless of the battle's real difficulty
   *   Distracted >= 100 -> enemySeconds loses 15 immediately (floored at 1)
   */
  computeAiMove(fen: string): { move: string } {
    throw new Error("Not implemented");
  }

  /**
   * Resolves the outcome and awards coins directly onto `player`.
   * Checkmate: winner determined by whose turn it was; any other end
   * reason (stalemate, draw, insufficient material, repetition, or a
   * timeout where the player ran out) -> ALWAYS EBattleResult.Defeat in
   * story mode (explicit frontend behavior, not a bug).
   * Coin formula on victory only: Master -> 50, Advanced/Intermediate -> 30,
   * Beginner/Easy -> 15. No penalty and no node-completion on defeat (node
   * remains re-attemptable). Sets player.journeyComplete if
   * `this.node instanceof OdysseyBossNode` and the result is a victory.
   */
  resolveOutcome(endReason: EBattleEndReason, playerWon: boolean, player: OdysseyPlayer): { result: EBattleResult; coinsAwarded: number } {
    throw new Error("Not implemented");
  }
}
