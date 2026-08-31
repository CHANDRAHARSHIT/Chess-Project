import { OdysseyNode } from "./OdysseyNode.js";
import { ENodeType } from "../enums/ENodeType.js";
import { EDifficulty } from "../enums/EDifficulty.js";
import { OdysseyMonster } from "./OdysseyMonster.js";

/** A regular or elite fight node. OdysseyBossNode extends this for the run's final encounter. */
export class OdysseyBattleNode extends OdysseyNode {
  readonly difficulty: EDifficulty;
  readonly monster: OdysseyMonster;

  constructor(
    id: number,
    type: ENodeType.Enemy | ENodeType.Elite | ENodeType.Boss,
    label: string,
    x: number,
    y: number,
    edges: number[],
    description: string,
    difficulty: EDifficulty
  ) {
    super(id, type, label, x, y, edges, description);
    throw new Error("Not implemented"); // would assign difficulty and resolve this.monster via OdysseyMonster.forNode(this)
  }
}
