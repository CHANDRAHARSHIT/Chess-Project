import { EDifficulty } from "../enums/EDifficulty.js";
import { ENodeType } from "../enums/ENodeType.js";
import type { OdysseyBattleNode } from "./OdysseyBattleNode.js";

export class OdysseyMonster {
  readonly name: string;
  readonly title: string;
  readonly rating: string;
  readonly icon: string;

  constructor(name: string, title: string, rating: string, icon: string) {
    this.name = name;
    this.title = title;
    this.rating = rating;
    this.icon = icon;
  }

  /**
   * Deterministic monster selection for a battle node (StoryModeBattle's
   * `monster` useMemo) — moved here so the rule lives on the thing it
   * produces, not on OdysseyMap:
   *   node.type === Boss             -> Dark King (~3000)
   *   difficulty Advanced             -> Queen's Guard (~2000)
   *   difficulty Intermediate         -> Rook Colossus (~1600)
   *   difficulty Easy                 -> Knight Prowler / Bishop Phantom,
   *                                       50/50 keyed on `node.id % 2` (NOT random)
   *   difficulty Beginner (default)   -> Pawn Sentinel (~800)
   *
   * Checks `node.type` rather than `instanceof OdysseyBossNode` so this
   * file doesn't need to import OdysseyBossNode — that would create a
   * circular module dependency (OdysseyBossNode -> OdysseyBattleNode ->
   * OdysseyMonster).
   */
  static forNode(node: OdysseyBattleNode): OdysseyMonster {
    if (node.type === ENodeType.Boss) {
      return new OdysseyMonster("The Dark King", "Sovereign of the Ending", "~3000", "dark-king");
    }

    switch (node.difficulty) {
      case EDifficulty.Advanced:
        return new OdysseyMonster("Queen's Guard", "Royal Protector", "~2000", "queens-guard");
      case EDifficulty.Intermediate:
        return new OdysseyMonster("Rook Colossus", "Stone Bastion", "~1600", "rook-colossus");
      case EDifficulty.Easy:
        return node.id % 2 === 0
          ? new OdysseyMonster("Knight Prowler", "Shadow Ambusher", "~1200", "knight-prowler")
          : new OdysseyMonster("Bishop Phantom", "Diagonal Wraith", "~1200", "bishop-phantom");
      case EDifficulty.Beginner:
      default:
        return new OdysseyMonster("Pawn Sentinel", "First Line", "~800", "pawn-sentinel");
    }
  }

  describe(): string {
    return `${this.name}, ${this.title} (${this.rating})`;
  }
}
