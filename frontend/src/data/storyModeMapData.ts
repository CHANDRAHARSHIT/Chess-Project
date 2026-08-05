/**
 * storyModeMapData.ts
 *
 * Hardcoded adventure-map graph for the Story Mode feature.
 * 11 nodes arranged bottom-to-top, matching the reference map layout.
 *
 * Each node has a type (start / monster / mystery / fireplace / boss),
 * a position (percentage-based for responsive rendering), an optional
 * difficulty level for chess battles, and edges to connected nodes.
 */

import type { DifficultyLevel } from "../types/chess";

// ── Node types ──────────────────────────────────────────────────────────────

export type StoryNodeType =
  | "start"
  | "monster"
  | "mystery"
  | "fireplace"
  | "boss";

export type NodeStatus =
  | "locked"     // Cannot be visited yet
  | "available"  // Adjacent to a completed node — can be clicked
  | "active"     // Player is currently here
  | "completed"; // Already defeated / visited

export interface StoryNode {
  id: number;
  type: StoryNodeType;
  label: string;
  /** Position as percentage of the map canvas (0-100) */
  x: number;
  y: number;
  /** Difficulty for monster/boss nodes (maps to DifficultyLevel) */
  difficulty?: DifficultyLevel;
  /** IDs of nodes reachable from this node */
  edges: number[];
  /** Flavour text shown when entering the node */
  description: string;
}

// ── Hardcoded map ───────────────────────────────────────────────────────────

export const STORY_MAP_NODES: StoryNode[] = [
  {
    id: 0,
    type: "start",
    label: "The Beginning",
    x: 35,
    y: 92,
    edges: [1, 2],
    description:
      "Your journey begins here. The path ahead is shrouded in darkness…",
  },
  {
    id: 1,
    type: "mystery",
    label: "Shadowed Crossroads",
    x: 18,
    y: 76,
    edges: [2, 3],
    description: "A strange fog swirls around this clearing. Something stirs…",
  },
  {
    id: 2,
    type: "monster",
    label: "Pawn Sentinel",
    x: 22,
    y: 60,
    difficulty: 1,
    edges: [4, 5],
    description:
      "A lumbering pawn golem blocks the path. Defeat it to proceed!",
  },
  {
    id: 3,
    type: "fireplace",
    label: "Wayward Campfire",
    x: 50,
    y: 64,
    edges: [5, 6],
    description:
      "The warm glow of a campfire flickers in the night. Rest here to regain strength.",
  },
  {
    id: 4,
    type: "monster",
    label: "Knight Prowler",
    x: 18,
    y: 44,
    difficulty: 2,
    edges: [7, 5],
    description:
      "A spectral knight leaps from the shadows, challenging you to battle!",
  },
  {
    id: 5,
    type: "monster",
    label: "Bishop Phantom",
    x: 48,
    y: 44,
    difficulty: 2,
    edges: [7, 8],
    description:
      "A ghostly bishop materializes, its diagonal gaze piercing the darkness.",
  },
  {
    id: 6,
    type: "mystery",
    label: "Forgotten Reliquary",
    x: 78,
    y: 48,
    edges: [8],
    description:
      "An ancient chest gleams faintly. What treasures — or traps — lie within?",
  },
  {
    id: 7,
    type: "monster",
    label: "Rook Colossus",
    x: 48,
    y: 28,
    difficulty: 3,
    edges: [9],
    description:
      "A towering rook construct guards the upper reaches. Only the skilled may pass.",
  },
  {
    id: 8,
    type: "mystery",
    label: "Whispering Ruins",
    x: 75,
    y: 28,
    edges: [9],
    description:
      "The wind carries whispers of forgotten games and ancient openings…",
  },
  {
    id: 9,
    type: "fireplace",
    label: "Summit Sanctuary",
    x: 22,
    y: 16,
    edges: [10],
    description:
      "A sacred flame burns atop the summit. Gather your strength for the final trial.",
  },
  {
    id: 10,
    type: "boss",
    label: "The Dark King",
    x: 72,
    y: 6,
    difficulty: 4,
    edges: [],
    description:
      "The Dark King awaits on his obsidian throne. This is the final battle — checkmate or be checkmated!",
  },
];

// ── Monster profiles ────────────────────────────────────────────────────────

export interface MonsterProfile {
  name: string;
  title: string;
  rating: string;
  /** Emoji or icon key */
  icon: string;
}

export const MONSTER_PROFILES: Record<number, MonsterProfile> = {
  2: {
    name: "Pawn Sentinel",
    title: "Guardian of the Threshold",
    rating: "~800",
    icon: "♟",
  },
  4: {
    name: "Knight Prowler",
    title: "Shadow Leaper",
    rating: "~1200",
    icon: "♞",
  },
  5: {
    name: "Bishop Phantom",
    title: "Diagonal Specter",
    rating: "~1200",
    icon: "♝",
  },
  7: {
    name: "Rook Colossus",
    title: "Fortress of Stone",
    rating: "~1600",
    icon: "♜",
  },
  10: {
    name: "The Dark King",
    title: "Lord of the Obsidian Throne",
    rating: "~2000",
    icon: "♚",
  },
};

// ── Random encounter flavour ────────────────────────────────────────────────

export const RANDOM_ENCOUNTERS = [
  {
    title: "Mysterious Traveler",
    text: "A cloaked figure offers you a chess riddle. You ponder its meaning…",
    effect: "You feel wiser. (+Insight)",
  },
  {
    title: "Abandoned Library",
    text: "Dusty tomes of opening theory line the shelves. You study a few pages.",
    effect: "You learned a new opening idea! (+Knowledge)",
  },
  {
    title: "Enchanted Spring",
    text: "A crystalline spring pulses with energy. You drink deeply.",
    effect: "Your focus sharpens. (+Clarity)",
  },
  {
    title: "Ghost of a Grandmaster",
    text: "The spectral form of a grandmaster appears and shares a tactical pattern.",
    effect: "You absorbed a tactical motif! (+Tactics)",
  },
  {
    title: "Merchant of Pieces",
    text: "A strange merchant displays captured pieces arranged in a puzzle. You solve it.",
    effect: "The merchant nods approvingly. (+Reputation)",
  },
  {
    title: "Falling Star",
    text: "A shooting star streaks across the sky. You make a wish upon it.",
    effect: "Fortune smiles upon you. (+Luck)",
  },
];
