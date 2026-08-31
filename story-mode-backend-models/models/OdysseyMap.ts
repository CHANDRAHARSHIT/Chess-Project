import { OdysseyNode } from "./OdysseyNode.js";
import { ENodeStatus } from "../enums/ENodeStatus.js";
import type { OdysseyPlayer } from "./OdysseyPlayer.js";

export const MAX_PATH_LENGTH = 16; // Start + 15 Floors + Boss = 17 nodes, 16 completions to 100%

export class OdysseyMap {
  readonly nodes: OdysseyNode[];

  constructor(nodes: OdysseyNode[]) {
    throw new Error("Not implemented");
  }

  /**
   * Procedurally generates a fresh run map: 15 floors x 7 columns, 6-path
   * random branching graph, weighted room-type assignment (puzzle/rest/
   * elite/merchant/enemy) with adjacency constraints (no two rest/elite/
   * merchant in a row), fixed OdysseyStartNode (id 0) and one OdysseyBossNode.
   *
   * `seed` is NEW — the frontend's generator is unseeded Math.random(); a
   * server port should accept a seed so runs are reproducible/auditable.
   */
  static generate(seed?: string): OdysseyMap {
    throw new Error("Not implemented");
  }

  getNode(nodeId: number): OdysseyNode | undefined {
    throw new Error("Not implemented");
  }

  /** Delegates to node.statusFor(player) — this class no longer computes the rule itself. */
  getNodeStatus(nodeId: number, player: OdysseyPlayer): ENodeStatus {
    throw new Error("Not implemented");
  }
}
