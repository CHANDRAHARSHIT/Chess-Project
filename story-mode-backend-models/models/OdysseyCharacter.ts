import type { OdysseyPlayer } from "./OdysseyPlayer.js";

/**
 * StoryModeCharacterSelect.tsx today is copy-only: the 3 characters
 * (Knight/Bishop/Rook) and their "Unlocked by reaching Floor 10" / "by
 * defeating the Dark King" descriptions are hardcoded strings, evaluated
 * by NO code anywhere, and the selected character id is discarded on
 * select. This class is GREENFIELD — there is no existing logic to port,
 * only UI copy to turn into real rules if the owner wants character
 * choice to matter.
 */
export class OdysseyCharacter {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly unlocked: boolean;

  constructor(id: string, name: string, description: string, unlocked: boolean) {
    throw new Error("Not implemented");
  }

  /**
   * Proposed unlock rules, inferred from the frontend's copy text (NOT
   * currently enforced anywhere):
   *   knight -> always unlocked
   *   bishop -> unlocked once player.completedNodes.length >= 10 ("Floor 10")
   *   rook   -> unlocked once player.journeyComplete is true (defeated the Dark King)
   */
  static getAvailable(player: OdysseyPlayer): OdysseyCharacter[] {
    throw new Error("Not implemented");
  }

  /**
   * NEW — persists the chosen character to player.selectedCharacterId.
   * Rejects (or no-ops) if the requested character isn't unlocked per
   * getAvailable. Has no mechanical effect on Battle/Merchant/Rest/Puzzle
   * today since none of those classes read this field.
   */
  static select(characterId: string, player: OdysseyPlayer): void {
    throw new Error("Not implemented");
  }
}
