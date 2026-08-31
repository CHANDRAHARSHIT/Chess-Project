import { OdysseyBattleNode } from "./OdysseyBattleNode.js";
import { ENodeType } from "../enums/ENodeType.js";
import { EDifficulty } from "../enums/EDifficulty.js";

/**
 * The one boss node per run — always the Dark King at EDifficulty.Master.
 * Its only behavioral difference from a normal OdysseyBattleNode is what
 * happens on victory: OdysseyBattle.resolveOutcome checks
 * `node instanceof OdysseyBossNode` and sets player.journeyComplete.
 */
export class OdysseyBossNode extends OdysseyBattleNode {
  constructor(id: number, label: string, x: number, y: number, edges: number[], description: string) {
    super(id, ENodeType.Boss, label, x, y, edges, description, EDifficulty.Intermediate);
    // NOTE: frontend's monster-selection rule (StoryModeBattle's `monster` useMemo)
    // treats difficulty 5 OR type "boss" as Dark King — the boss node's actual
    // in-game difficulty tier is 3 (Intermediate) per mapGenerator.ts, monster
    // selection is keyed off `type === "boss"` here, not off this difficulty value.
  }
}
