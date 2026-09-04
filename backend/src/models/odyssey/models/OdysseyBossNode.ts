import { OdysseyBattleNode } from "./OdysseyBattleNode.js";
import { ENodeType } from "../enums/ENodeType.js";
import { EDifficulty } from "../enums/EDifficulty.js";

/**
 * The one boss node per run — always the Dark King. Its only behavioral
 * difference from a normal OdysseyBattleNode is what happens on victory:
 * OdysseyBattle.resolveOutcome checks `this.node.type === ENodeType.Boss`
 * and sets game.journeyComplete.
 */
export class OdysseyBossNode extends OdysseyBattleNode {
  constructor(id: number, label: string, x: number, y: number, edges: number[], description: string) {
    // Master (5) — the boss is always the single hardest encounter in the run,
    // strictly above every Elite (capped at Advanced/4, see OdysseyMap.difficultyFor).
    super(id, ENodeType.Boss, label, x, y, edges, description, EDifficulty.Master);
  }
}
