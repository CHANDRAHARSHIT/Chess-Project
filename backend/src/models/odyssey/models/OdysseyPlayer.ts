import { EPlayerType } from "../enums/EPlayerType.js";
import type { OdysseyGame } from "./OdysseyGame.js";

const BISHOP_UNLOCK_FLOOR = 10;
const STRATEGIST_MAX_HEALTH = 80;
const STRATEGIST_GOLD = 99;

/** A named combat ability — only populated for characters that define one today (Strategist). */
export interface OdysseyPlayerAbility {
  name: string;
  description: string;
}

/**
 * Represents a player (character) in Odyssey — e.g. the Strategist, the
 * Knight, the Bishop, the Rook. This is the identity a run is played as,
 * not the run itself: a run's persisted state (coins, map, progress,
 * which OdysseyPlayer was chosen) lives on OdysseyGame.
 *
 * Knight/Bishop/Rook are real future roster slots, not legacy code kept
 * around for removal: per the owner, they'll eventually appear as locked
 * cards on the same Strategist-style character screen (see the pre-run
 * Strategist intro's 4-card layout) rather than through the separate
 * in-map "champion select" overlay. Their actual designs (stats,
 * abilities, unlock conditions) haven't been decided yet — the unlock
 * rules below (floor 10, journey-complete) are placeholders carried over
 * from the frontend's own in-map roster copy, not a confirmed design.
 * Revisit this class once real character designs exist.
 */
export class OdysseyPlayer {
  readonly type: EPlayerType;
  readonly name: string;
  readonly description: string;
  readonly unlocked: boolean;
  readonly maxHealth?: number; // only the Strategist defines this today
  readonly gold?: number; // only the Strategist defines this today
  readonly ability?: OdysseyPlayerAbility; // only the Strategist defines this today

  constructor(
    type: EPlayerType,
    name: string,
    description: string,
    unlocked: boolean,
    maxHealth?: number,
    gold?: number,
    ability?: OdysseyPlayerAbility
  ) {
    this.type = type;
    this.name = name;
    this.description = description;
    this.unlocked = unlocked;
    this.maxHealth = maxHealth;
    this.gold = gold;
    this.ability = ability;
  }

  /** Whether this player can currently be chosen. */
  canBeSelected(): boolean {
    return this.unlocked;
  }

  /**
   * The full player roster, with unlock status computed from the run in
   * progress. NOT currently enforced anywhere in the frontend — inferred
   * from each screen's copy/content:
   *   Strategist -> always unlocked (the sole character shown on the
   *                 mandatory pre-run intro screen); Health 80, Gold 99,
   *                 ability "Calculated Mind" (draw 1 card at the start
   *                 of combat)
   *   Knight     -> always unlocked
   *   Bishop     -> unlocked once game.completedNodes.length >= 10 ("Floor 10")
   *   Rook       -> unlocked once game.journeyComplete is true (defeated the Dark King)
   */
  static getAvailable(game: OdysseyGame): OdysseyPlayer[] {
    return [
      new OdysseyPlayer(
        EPlayerType.Strategist,
        "The Strategist",
        "A master of foresight and calculation. Outmaneuvers enemies before they make a move.",
        true,
        STRATEGIST_MAX_HEALTH,
        STRATEGIST_GOLD,
        { name: "Calculated Mind", description: "At the start of combat, draw 1 card." }
      ),
      new OdysseyPlayer(EPlayerType.Knight, "The Knight", "A versatile warrior, mastering L-shaped ambushes.", true),
      new OdysseyPlayer(
        EPlayerType.Bishop,
        "The Bishop",
        `Strikes from afar. Unlocked by reaching Floor ${BISHOP_UNLOCK_FLOOR}.`,
        game.completedNodes.length >= BISHOP_UNLOCK_FLOOR
      ),
      new OdysseyPlayer(
        EPlayerType.Rook,
        "The Rook",
        "An immovable object. Unlocked by defeating the Dark King.",
        game.journeyComplete
      ),
    ];
  }

  /**
   * Selects a player type for `game`, if unlocked. No-ops for a locked or
   * unknown type. Has no mechanical effect on Battle/Merchant/Rest/Puzzle
   * today beyond identifying who's playing.
   */
  static select(type: EPlayerType, game: OdysseyGame): void {
    const player = OdysseyPlayer.getAvailable(game).find(candidate => candidate.type === type);
    if (!player || !player.canBeSelected()) {
      return;
    }
    game.player = player;
  }
}
