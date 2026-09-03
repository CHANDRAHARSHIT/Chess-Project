import { OdysseyBotConditions } from "./OdysseyBotConditions.js";
import { EBattleEndReason } from "../enums/EBattleEndReason.js";
import { EBattleResult } from "../enums/EBattleResult.js";
import { EBotCondition } from "../enums/EBotCondition.js";
import { EDifficulty } from "../enums/EDifficulty.js";
import type { OdysseyBattleNode } from "./OdysseyBattleNode.js";
import type { OdysseyMonster } from "./OdysseyMonster.js";
import type { OdysseyGame } from "./OdysseyGame.js";

const PLAYER_CLOCK_SECONDS: Record<EDifficulty, number> = {
  [EDifficulty.Master]: 180,
  [EDifficulty.Advanced]: 300,
  [EDifficulty.Intermediate]: 420,
  [EDifficulty.Easy]: 480,
  [EDifficulty.Beginner]: 600,
};

const ENEMY_CLOCK_SECONDS: Record<EDifficulty, number> = {
  [EDifficulty.Master]: 120,
  [EDifficulty.Advanced]: 90,
  [EDifficulty.Intermediate]: 60,
  [EDifficulty.Easy]: 60,
  [EDifficulty.Beginner]: 60,
};

const CONFUSED_RANDOM_MOVE_CHANCE = 0.5;
const DISTRACTED_ENEMY_TIME_PENALTY = 15;
const MIN_ENEMY_SECONDS = 1;

const CHECK_CONFUSED_INCREASE = 15;
const CAPTURE_DISTRACTED_INCREASE = 20;
const PASSIVE_RELAXED_INCREASE = 10;

const MASTER_VICTORY_COINS = 50;
const MID_TIER_VICTORY_COINS = 30;
const LOW_TIER_VICTORY_COINS = 15;
const NO_COINS_AWARDED = 0;

const INITIAL_EVAL_MOVES_REMAINING = 0;

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
    this.node = node;
    this.monster = node.monster;
    this.botConditions = new OdysseyBotConditions();
    this.playerInitialSeconds = PLAYER_CLOCK_SECONDS[node.difficulty];
    this.enemyInitialSeconds = ENEMY_CLOCK_SECONDS[node.difficulty];
    this.playerSeconds = this.playerInitialSeconds;
    this.enemySeconds = this.enemyInitialSeconds;
    this.evalMovesRemaining = INITIAL_EVAL_MOVES_REMAINING;
  }

  /**
   * Applies the player-move triggers to botConditions (each clamped to
   * [0,100] by OdysseyBotConditions.increase): +15 Confused if the move
   * gives check, +20 Distracted if the move is a capture (including en
   * passant), +10 Relaxed only if the move is neither a check nor a capture.
   */
  registerPlayerMove(move: { isCheck: boolean; isCapture: boolean }): void {
    if (move.isCheck) {
      this.botConditions.increase(EBotCondition.Confused, CHECK_CONFUSED_INCREASE);
    }
    if (move.isCapture) {
      this.botConditions.increase(EBotCondition.Distracted, CAPTURE_DISTRACTED_INCREASE);
    }
    if (!move.isCheck && !move.isCapture) {
      this.botConditions.increase(EBotCondition.Relaxed, PASSIVE_RELAXED_INCREASE);
    }
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
   *
   * `getLegalMoves`/`getEngineMove` are injected rather than imported: the
   * live chess position and the engine connection both live with the
   * caller, not this model.
   */
  async computeAiMove(
    fen: string,
    getLegalMoves: (fen: string) => string[],
    getEngineMove: (fen: string, difficulty: EDifficulty) => Promise<string>
  ): Promise<{ move: string }> {
    const isConfused = this.botConditions.isActive(EBotCondition.Confused);
    const isRelaxed = this.botConditions.isActive(EBotCondition.Relaxed);
    const isDistracted = this.botConditions.isActive(EBotCondition.Distracted);

    this.botConditions.consume(EBotCondition.Confused);
    this.botConditions.consume(EBotCondition.Relaxed);
    this.botConditions.consume(EBotCondition.Distracted);

    if (isDistracted) {
      this.enemySeconds = Math.max(MIN_ENEMY_SECONDS, this.enemySeconds - DISTRACTED_ENEMY_TIME_PENALTY);
    }

    if (isConfused && Math.random() < CONFUSED_RANDOM_MOVE_CHANCE) {
      const legalMoves = getLegalMoves(fen);
      if (legalMoves.length > 0) {
        const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        return { move: randomMove };
      }
    }

    const effectiveDifficulty = isRelaxed ? EDifficulty.Beginner : this.node.difficulty;
    const move = await getEngineMove(fen, effectiveDifficulty);
    return { move };
  }

  /**
   * Whether this end reason/outcome amounts to a story-mode victory:
   * checkmate specifically, with the player as the winner. Any other end
   * reason (stalemate, draw, insufficient material, repetition, or a
   * timeout where the player ran out) is NEVER a victory in story mode,
   * even if `playerWon` is somehow true (explicit frontend behavior, not
   * a bug) — named so this rule has one source of truth instead of being
   * re-derived inline wherever a battle's result matters.
   */
  isVictory(endReason: EBattleEndReason, playerWon: boolean): boolean {
    return endReason === EBattleEndReason.Checkmate && playerWon;
  }

  /**
   * Resolves the outcome and awards coins directly onto `game`.
   * Coin formula on victory only: Master -> 50, Advanced/Intermediate -> 30,
   * Beginner/Easy -> 15. No penalty and no node-completion on defeat (node
   * remains re-attemptable). Sets game.journeyComplete if this.node is the
   * boss and the result is a victory.
   */
  resolveOutcome(endReason: EBattleEndReason, playerWon: boolean, game: OdysseyGame): { result: EBattleResult; coinsAwarded: number } {
    const result = this.isVictory(endReason, playerWon) ? EBattleResult.Victory : EBattleResult.Defeat;

    if (result === EBattleResult.Defeat) {
      return { result, coinsAwarded: NO_COINS_AWARDED };
    }

    const coinsAwarded =
      this.node.difficulty === EDifficulty.Master
        ? MASTER_VICTORY_COINS
        : this.node.difficulty === EDifficulty.Advanced || this.node.difficulty === EDifficulty.Intermediate
          ? MID_TIER_VICTORY_COINS
          : LOW_TIER_VICTORY_COINS;

    game.addCoins(coinsAwarded);

    if (this.node.isBoss()) {
      game.journeyComplete = true;
    }

    return { result, coinsAwarded };
  }
}
