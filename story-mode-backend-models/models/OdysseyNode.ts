import { ENodeType } from "../enums/ENodeType.js";
import { ENodeStatus } from "../enums/ENodeStatus.js";
import type { OdysseyGame } from "./OdysseyGame.js";

/** Sentinel for OdysseyGame.currentNodeId meaning "no node entered yet". */
export const NO_CURRENT_NODE_ID = -1;
const START_NODE_ID = 0;

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
    this.id = id;
    this.type = type;
    this.label = label;
    this.x = x;
    this.y = y;
    this.edges = edges;
    this.description = description;
  }

  isAdjacentTo(nodeId: number): boolean {
    return this.edges.includes(nodeId);
  }

  /** Whether this node is the run's single boss encounter. */
  isBoss(): boolean {
    return this.type === ENodeType.Boss;
  }

  /**
   * This node's own status given the run's progress — the entity that
   * owns the rule computes it, not the caller. OdysseyMap.getNodeStatus
   * becomes a one-line delegate to this. Exact port of
   * StoryModeMap.getNodeStatus:
   * - "completed" if this.id is in game.completedNodes
   * - bootstrap case (nothing completed yet): only the start node (id 0)
   *   is "active"/"available", everything else "locked"
   * - "active" if this.id === game.currentNodeId
   * - "available" if game.currentNodeId is completed AND that node's
   *   edges include this.id
   * - otherwise "locked"
   */
  statusFor(game: OdysseyGame): ENodeStatus {
    if (game.completedNodes.includes(this.id)) {
      return ENodeStatus.Completed;
    }

    if (game.completedNodes.length === 0) {
      if (this.id === START_NODE_ID) {
        return this.id === game.currentNodeId ? ENodeStatus.Active : ENodeStatus.Available;
      }
      return ENodeStatus.Locked;
    }

    if (this.id === game.currentNodeId) {
      return ENodeStatus.Active;
    }

    if (game.currentNodeId !== NO_CURRENT_NODE_ID && game.completedNodes.includes(game.currentNodeId)) {
      const currentNode = game.map.getNode(game.currentNodeId);
      if (currentNode?.isAdjacentTo(this.id)) {
        return ENodeStatus.Available;
      }
    }

    return ENodeStatus.Locked;
  }
}
