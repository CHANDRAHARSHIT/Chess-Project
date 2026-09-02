import { EDifficulty } from "../enums/EDifficulty.js";
import type { OdysseyBattleNode } from "./OdysseyBattleNode.js";

/** Node-id parity used to alternate between the two Easy-tier monsters. */
const EASY_TIER_ALTERNATION = 2;
const EVEN_PARITY_REMAINDER = 0;

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
   * Checks `node.isBoss()` rather than `instanceof OdysseyBossNode` so
   * this file doesn't need to import OdysseyBossNode — that would create
   * a circular module dependency (OdysseyBossNode -> OdysseyBattleNode ->
   * OdysseyMonster).
   */
  static forNode(node: OdysseyBattleNode): OdysseyMonster {
    if (node.isBoss()) {
      return DARK_KING;
    }

    switch (node.difficulty) {
      case EDifficulty.Advanced:
        return QUEENS_GUARD;
      case EDifficulty.Intermediate:
        return ROOK_COLOSSUS;
      case EDifficulty.Easy:
        return node.id % EASY_TIER_ALTERNATION === EVEN_PARITY_REMAINDER ? KNIGHT_PROWLER : BISHOP_PHANTOM;
      case EDifficulty.Beginner:
      default:
        return PAWN_SENTINEL;
    }
  }

  describe(): string {
    return `${this.name}, ${this.title} (${this.rating})`;
  }
}

// Shared, immutable monster profiles — one instance per named monster,
// reused across every node that resolves to it (pure display data, safe
// to share).
const DARK_KING = new OdysseyMonster("The Dark King", "Sovereign of the Ending", "~3000", "dark-king");
const QUEENS_GUARD = new OdysseyMonster("Queen's Guard", "Royal Protector", "~2000", "queens-guard");
const ROOK_COLOSSUS = new OdysseyMonster("Rook Colossus", "Stone Bastion", "~1600", "rook-colossus");
const KNIGHT_PROWLER = new OdysseyMonster("Knight Prowler", "Shadow Ambusher", "~1200", "knight-prowler");
const BISHOP_PHANTOM = new OdysseyMonster("Bishop Phantom", "Diagonal Wraith", "~1200", "bishop-phantom");
const PAWN_SENTINEL = new OdysseyMonster("Pawn Sentinel", "First Line", "~800", "pawn-sentinel");
