import { ENodeType } from "../enums/ENodeType.js";
import { ENodeStatus } from "../enums/ENodeStatus.js";
import type { OdysseyPlayer } from "./OdysseyPlayer.js";

/**
 * A single point on the run map.
 *
 * Concrete on its own — used directly for Start/Rest/Merchant nodes,
 * which carry no data beyond `type` today. OdysseyBattleNode and
 * OdysseyPuzzleNode extend it because they genuinely carry extra fields
 * (difficulty, monster); a separate OdysseyStartNode/RestNode/MerchantNode
 * subclass would have added three classes with nothing in them beyond a
 * type tag the base class already has — cut after review rather than kept
 * for pattern-symmetry alone. Revisit if any of those three node types
 * grows real data or its own override of statusFor().
 */
export class OdysseyNode {
  readonly id: number;
  readonly type: ENodeType;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly edges: number[]; // adjacency list, roguelike branching path
  readonly description: string;

  constructor(id: number, type: ENodeType, label: string, x: number, y: number, edges: number[], description: string) {
    throw new Error("Not implemented");
  }

  isAdjacentTo(nodeId: number): boolean {
    throw new Error("Not implemented"); // edges.includes(nodeId)
  }

  /**
   * This node's own status given the player's progress — mirrors
   * Session.isActive(): the entity that owns the rule computes it, not
   * the caller. OdysseyMap.getNodeStatus becomes a one-line delegate to
   * this. Exact port of StoryModeMap.getNodeStatus:
   * - "completed" if this.id is in player.completedNodes
   * - bootstrap case (nothing completed yet): only the start node (id 0)
   *   is "active"/"available", everything else "locked"
   * - "active" if this.id === player.currentNodeId
   * - "available" if player.currentNodeId is completed AND that node's
   *   edges include this.id
   * - otherwise "locked"
   */
  statusFor(player: OdysseyPlayer): ENodeStatus {
    throw new Error("Not implemented");
  }
}
