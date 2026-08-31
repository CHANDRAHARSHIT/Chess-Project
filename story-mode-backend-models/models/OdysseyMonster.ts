import type { OdysseyBattleNode } from "./OdysseyBattleNode.js";

export class OdysseyMonster {
  readonly name: string;
  readonly title: string;
  readonly rating: string;
  readonly icon: string;

  constructor(name: string, title: string, rating: string, icon: string) {
    throw new Error("Not implemented");
  }

  /**
   * Deterministic monster selection for a battle node (StoryModeBattle's
   * `monster` useMemo) — moved here so the rule lives on the thing it
   * produces, not on OdysseyMap:
   *   node instanceof OdysseyBossNode -> Dark King (~3000)
   *   difficulty Advanced             -> Queen's Guard (~2000)
   *   difficulty Intermediate         -> Rook Colossus (~1600)
   *   difficulty Easy                 -> Knight Prowler / Bishop Phantom,
   *                                       50/50 keyed on `node.id % 2` (NOT random)
   *   difficulty Beginner (default)   -> Pawn Sentinel (~800)
   */
  static forNode(node: OdysseyBattleNode): OdysseyMonster {
    throw new Error("Not implemented");
  }

  describe(): string {
    throw new Error("Not implemented"); // `${name}, ${title} (${rating})`
  }
}
