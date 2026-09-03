import { OdysseyNode } from "./OdysseyNode.js";
import { ENodeType } from "../enums/ENodeType.js";
import { EDifficulty } from "../enums/EDifficulty.js";

/** The map node. The live puzzle-solving session it opens is OdysseyPuzzleEncounter. */
export class OdysseyPuzzleNode extends OdysseyNode {
  readonly difficulty: EDifficulty;

  constructor(id: number, label: string, x: number, y: number, edges: number[], description: string, difficulty: EDifficulty) {
    super(id, ENodeType.Puzzle, label, x, y, edges, description);
    this.difficulty = difficulty;
  }
}
