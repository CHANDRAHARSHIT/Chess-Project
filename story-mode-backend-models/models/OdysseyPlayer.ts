import { EPlayerType } from "../enums/EPlayerType.js";
import type { OdysseyGame } from "./OdysseyGame.js";

const BISHOP_UNLOCK_FLOOR = 10;

/**
 * Represents a player (character) in Odyssey — e.g. the Knight, the
 * Bishop, the Rook, the Strategist. This is the identity a run is played
 * as, not the run itself: a run's persisted state (coins, map, progress,
 * which OdysseyPlayer was chosen) lives on OdysseyGame.
 */
export class OdysseyPlayer {
  readonly type: EPlayerType;
  readonly name: string;
  readonly description: string;
  readonly unlocked: boolean;

  constructor(type: EPlayerType, name: string, description: string, unlocked: boolean) {
    this.type = type;
    this.name = name;
    this.description = description;
    this.unlocked = unlocked;
  }

  /** Whether this player can currently be chosen. */
  canBeSelected(): boolean {
    return this.unlocked;
  }

  /**
   * The roster shown on the character-select screen, with unlock status
   * computed from the run in progress. NOT currently enforced anywhere in
   * the frontend — inferred from its copy text:
   *   Knight -> always unlocked
   *   Bishop -> unlocked once game.completedNodes.length >= 10 ("Floor 10")
   *   Rook   -> unlocked once game.journeyComplete is true (defeated the Dark King)
   *
   * Strategist is a named player type from an earlier, currently-unused
   * prototype screen — kept as an EPlayerType value since it has a real
   * name, but left out of the roster since no unlock rule or playable
   * content exists for it today.
   */
  static getAvailable(game: OdysseyGame): OdysseyPlayer[] {
    return [
      new OdysseyPlayer(EPlayerType.Knight, "The Knight", "A versatile warrior, mastering L-shaped ambushes.", true),
      new OdysseyPlayer(
        EPlayerType.Bishop,
        "The Bishop",
        "Strikes from afar. Unlocked by reaching Floor 10.",
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
