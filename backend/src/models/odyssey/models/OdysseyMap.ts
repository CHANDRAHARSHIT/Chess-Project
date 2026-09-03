import { OdysseyNode } from "./OdysseyNode.js";
import { OdysseyBattleNode } from "./OdysseyBattleNode.js";
import { OdysseyBossNode } from "./OdysseyBossNode.js";
import { OdysseyPuzzleNode } from "./OdysseyPuzzleNode.js";
import { ENodeType } from "../enums/ENodeType.js";
import { ENodeStatus } from "../enums/ENodeStatus.js";
import { EDifficulty } from "../enums/EDifficulty.js";
import type { OdysseyGame } from "./OdysseyGame.js";

export const MAX_PATH_LENGTH = 16; // Start + 15 Floors + Boss = 17 nodes, 16 completions to 100%

const FLOOR_COUNT = 15;
const MIN_NODES_PER_FLOOR = 2;
const MAX_NODES_PER_FLOOR = 4;
const MIN_PREDECESSORS = 1;
const MAX_PREDECESSORS = 2;

const BEGINNER_MAX_FLOOR = 3;
const EASY_MAX_FLOOR = 6;
const INTERMEDIATE_MAX_FLOOR = 10;

const START_NODE_ID = 0;
const START_NODE_LABEL = "Pawn Sentinel";
const START_NODE_DESCRIPTION = "The journey begins.";
const START_X = 50;
const START_Y = 0;

const BOSS_NODE_LABEL = "The Dark King";
const BOSS_NODE_DESCRIPTION = "The final battle.";
const BOSS_X = 50;
const BOSS_Y = 100;
const BOSS_FLOOR_OFFSET = 1; // the boss sits one "floor" past the last generated floor
const NO_EDGES: number[] = [];

const CENTER_COLUMN = 3; // placeholder column for the single-node start/boss floors

const ENEMY_NODE_DESCRIPTION = "A foe blocks the path.";
const PUZZLE_NODE_DESCRIPTION = "A trial of tactics.";
const REST_NODE_DESCRIPTION = "A quiet place to recover.";
const MERCHANT_NODE_DESCRIPTION = "A wandering trader.";

const POSITION_SCALE = 100; // x/y are expressed as 0-100 (percent of the map canvas)
const COLUMN_SPACING_OFFSET = 1;
const FLOOR_SPACING_OFFSET = 1;

/** No two of these in a row along any single edge — mirrors mapGenerator.ts's adjacency constraint. */
const RESTRICTED_TYPES = new Set<ENodeType>([ENodeType.Rest, ENodeType.Elite, ENodeType.Merchant]);

const WEIGHTED_TYPES: { type: ENodeType; weight: number }[] = [
  { type: ENodeType.Enemy, weight: 45 },
  { type: ENodeType.Elite, weight: 15 },
  { type: ENodeType.Puzzle, weight: 15 },
  { type: ENodeType.Rest, weight: 12 },
  { type: ENodeType.Merchant, weight: 13 },
];

interface NodePlan {
  id: number;
  floor: number;
  column: number;
  predecessors: number[];
  type: ENodeType;
}

/** Unseeded by default (matches the frontend's Math.random()-based generator); seeded via a small mulberry32 PRNG when `seed` is given, so a run can be reproduced/audited. */
function createRng(seed?: string): () => number {
  if (!seed) {
    return Math.random;
  }
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeightedType(rng: () => number, excludeRestricted: boolean): ENodeType {
  const pool = excludeRestricted ? WEIGHTED_TYPES.filter(entry => !RESTRICTED_TYPES.has(entry.type)) : WEIGHTED_TYPES;
  const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng() * total;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.type;
    }
  }
  return pool[pool.length - 1].type;
}

function difficultyForFloor(floor: number): EDifficulty {
  if (floor <= BEGINNER_MAX_FLOOR) return EDifficulty.Beginner;
  if (floor <= EASY_MAX_FLOOR) return EDifficulty.Easy;
  if (floor <= INTERMEDIATE_MAX_FLOOR) return EDifficulty.Intermediate;
  return EDifficulty.Advanced;
}

export class OdysseyMap {
  readonly nodes: OdysseyNode[];

  constructor(nodes: OdysseyNode[]) {
    this.nodes = nodes;
  }

  /**
   * Procedurally generates a fresh run map: 15 floors, a random branching
   * graph (each node connects to 1-2 nodes in the next floor, every node
   * guaranteed at least one outgoing edge), weighted room-type assignment
   * (enemy/elite/puzzle/rest/merchant) with the adjacency constraint (no
   * two Rest/Elite/Merchant in a row along an edge), a fixed start node
   * (id 0) and a single boss node that every floor-15 leaf converges on.
   *
   * Implements the constraints documented for the frontend's generator
   * (15 floors, weighted types, adjacency rule); the exact column-count
   * and path-count constants weren't verified byte-for-byte against
   * frontend/src/shared/chess/mapGenerator.ts, so a side-by-side diff is
   * worth doing before this ships if exact parity matters.
   */
  static generate(seed?: string): OdysseyMap {
    const rng = createRng(seed);

    const startPlan: NodePlan = { id: START_NODE_ID, floor: 0, column: CENTER_COLUMN, predecessors: [], type: ENodeType.Start };
    const floors: NodePlan[][] = [];
    let nextId = 1;
    let previousFloor: NodePlan[] = [startPlan];

    for (let floor = 1; floor <= FLOOR_COUNT; floor++) {
      const count = MIN_NODES_PER_FLOOR + Math.floor(rng() * (MAX_NODES_PER_FLOOR - MIN_NODES_PER_FLOOR + 1));
      const thisFloor: NodePlan[] = [];

      for (let column = 0; column < count; column++) {
        const predecessorCount = Math.min(
          previousFloor.length,
          MIN_PREDECESSORS + Math.floor(rng() * (MAX_PREDECESSORS - MIN_PREDECESSORS + 1))
        );
        const predecessors = new Set<number>();
        while (predecessors.size < predecessorCount) {
          predecessors.add(previousFloor[Math.floor(rng() * previousFloor.length)].id);
        }
        thisFloor.push({ id: nextId++, floor, column, predecessors: [...predecessors], type: ENodeType.Enemy });
      }

      // Guarantee every node in the previous floor has at least one outgoing edge.
      for (const prevNode of previousFloor) {
        const hasOutgoing = thisFloor.some(node => node.predecessors.includes(prevNode.id));
        if (!hasOutgoing) {
          thisFloor[Math.floor(rng() * thisFloor.length)].predecessors.push(prevNode.id);
        }
      }

      floors.push(thisFloor);
      previousFloor = thisFloor;
    }

    const bossPlan: NodePlan = {
      id: nextId,
      floor: FLOOR_COUNT + BOSS_FLOOR_OFFSET,
      column: CENTER_COLUMN,
      predecessors: previousFloor.map(node => node.id),
      type: ENodeType.Boss,
    };

    const allPlans: NodePlan[] = [startPlan, ...floors.flat(), bossPlan];
    const planById = new Map(allPlans.map(plan => [plan.id, plan]));

    // Assign types, respecting "no two restricted types (Rest/Elite/Merchant) in a row".
    for (const floor of floors) {
      for (const plan of floor) {
        const predecessorIsRestricted = plan.predecessors.some(id => RESTRICTED_TYPES.has(planById.get(id)!.type));
        plan.type = pickWeightedType(rng, predecessorIsRestricted);
      }
    }

    // Forward edges are the inverse of the predecessor links collected above.
    const edgesById = new Map<number, number[]>(allPlans.map(plan => [plan.id, []]));
    for (const plan of allPlans) {
      for (const predecessorId of plan.predecessors) {
        edgesById.get(predecessorId)!.push(plan.id);
      }
    }

    const nodes: OdysseyNode[] = [];
    nodes.push(
      new OdysseyNode(
        startPlan.id,
        ENodeType.Start,
        START_NODE_LABEL,
        START_X,
        START_Y,
        edgesById.get(startPlan.id) ?? NO_EDGES,
        START_NODE_DESCRIPTION
      )
    );

    for (const floor of floors) {
      const columnCount = floor.length;
      for (const plan of floor) {
        const x = ((plan.column + COLUMN_SPACING_OFFSET) / (columnCount + COLUMN_SPACING_OFFSET)) * POSITION_SCALE;
        const y = (plan.floor / (FLOOR_COUNT + FLOOR_SPACING_OFFSET)) * POSITION_SCALE;
        const edges = edgesById.get(plan.id) ?? NO_EDGES;
        const difficulty = difficultyForFloor(plan.floor);
        const label = `Floor ${plan.floor}`;

        switch (plan.type) {
          case ENodeType.Enemy:
          case ENodeType.Elite:
            nodes.push(new OdysseyBattleNode(plan.id, plan.type, label, x, y, edges, ENEMY_NODE_DESCRIPTION, difficulty));
            break;
          case ENodeType.Puzzle:
            nodes.push(new OdysseyPuzzleNode(plan.id, label, x, y, edges, PUZZLE_NODE_DESCRIPTION, difficulty));
            break;
          case ENodeType.Rest:
            nodes.push(new OdysseyNode(plan.id, ENodeType.Rest, label, x, y, edges, REST_NODE_DESCRIPTION));
            break;
          case ENodeType.Merchant:
            nodes.push(new OdysseyNode(plan.id, ENodeType.Merchant, label, x, y, edges, MERCHANT_NODE_DESCRIPTION));
            break;
          default:
            throw new Error(`Unexpected node type during construction: ${plan.type}`);
        }
      }
    }

    nodes.push(new OdysseyBossNode(bossPlan.id, BOSS_NODE_LABEL, BOSS_X, BOSS_Y, NO_EDGES, BOSS_NODE_DESCRIPTION));

    return new OdysseyMap(nodes);
  }

  getNode(nodeId: number): OdysseyNode | undefined {
    return this.nodes.find(node => node.id === nodeId);
  }

  /** Delegates to node.statusFor(game) — this class no longer computes the rule itself. */
  getNodeStatus(nodeId: number, game: OdysseyGame): ENodeStatus {
    const node = this.getNode(nodeId);
    if (!node) {
      throw new Error(`Unknown node id: ${nodeId}`);
    }
    return node.statusFor(game);
  }
}
