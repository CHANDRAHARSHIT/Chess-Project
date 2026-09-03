import type { StoryNode, StoryNodeType } from "@/data/storymode-storyModeMapData";
import type { DifficultyLevel } from "@/types/chess-chess.types";

const COLUMNS = 7;
const FLOORS = 15;
const PATHS = 6;

interface GridNode {
  f: number;
  c: number;
  exists: boolean;
  edges: number[];
  type: StoryNodeType | null;
}

export function generateStoryMap(): StoryNode[] {
  let grid: GridNode[][] = [];
  let validMap = false;

  while (!validMap) {
    grid = Array.from({ length: FLOORS }, (_, f) =>
      Array.from({ length: COLUMNS }, (_, c) => ({
        f,
        c,
        exists: false,
        edges: [],
        type: null,
      }))
    );

    // Ensure 3, 4, or 5 symmetrically centered starting nodes
    // We have 6 paths, so we distribute them among these columns
    const configurations = [
      [1, 1, 3, 3, 5, 5], // 3 nodes (wide)
      [2, 2, 3, 3, 4, 4], // 3 nodes (tight)
      [1, 2, 2, 4, 4, 5], // 4 nodes
      [1, 2, 3, 3, 4, 5], // 5 nodes
    ];
    const startColumns = configurations[Math.floor(Math.random() * configurations.length)];

    // 1. Path Generation Loop
    for (let p = 0; p < PATHS; p++) {
      let currentC = startColumns[p];
      grid[0][currentC].exists = true;

      for (let f = 0; f < FLOORS - 1; f++) {
        // Find valid next columns
        const possibleNext = [currentC - 1, currentC, currentC + 1].filter(
          (nextC) => nextC >= 0 && nextC < COLUMNS
        );

        const validNext = possibleNext.filter((nextC) => {
          // Check for edge crossings
          for (let a = 0; a < COLUMNS; a++) {
            const nodeA = grid[f][a];
            if (!nodeA.exists) continue;
            for (const b of nodeA.edges) {
              if (a < currentC && b > nextC) return false;
              if (a > currentC && b < nextC) return false;
            }
          }
          return true;
        });

        let nextC = currentC;
        if (validNext.length > 0) {
          nextC = validNext[Math.floor(Math.random() * validNext.length)];
        }

        if (!grid[f][currentC].edges.includes(nextC)) {
          grid[f][currentC].edges.push(nextC);
        }
        grid[f + 1][nextC].exists = true;
        currentC = nextC;
      }
    }

    // 2. Guarantee paths don't collapse too much early on
    const startNodes = grid[0].filter((n) => n.exists).length;
    // As long as we generated successfully, validMap = true
    if (startNodes >= 3 && startNodes <= 5) {
      validMap = true;
    }
  }

  const getParents = (f: number, c: number) => {
    if (f === 0) return [];
    return grid[f - 1].filter(n => n.exists && n.edges.includes(c));
  };

  // 3. Room Type Assignment
  for (let f = 0; f < FLOORS; f++) {
    for (let c = 0; c < COLUMNS; c++) {
      const node = grid[f][c];
      if (!node.exists) continue;

      if (f === 0) {
        node.type = "enemy";
      } else if (f === FLOORS - 1) {
        node.type = "rest";
      } else if (f === 8) {
        // Floor 9 (0-indexed 8) randomly assigned but we don't fix it as per user feedback
        node.type = pickValidRoomType(f, c, grid, getParents(f, c));
      } else {
        node.type = pickValidRoomType(f, c, grid, getParents(f, c));
      }
    }
  }

  // 4. Build Final StoryNode Array
  const storyNodes: StoryNode[] = [];
  let idCounter = 0;
  
  // Single Start Node ID
  const startNodeId = idCounter++;

  const idMap = new Map<string, number>();
  
  for (let f = 0; f < FLOORS; f++) {
    for (let c = 0; c < COLUMNS; c++) {
      if (grid[f][c].exists) {
        idMap.set(`${f},${c}`, idCounter++);
      }
    }
  }

  const bossId = idCounter++;
  
  // Collect edges for the single start node
  const startingEdges = grid[0]
    .filter(n => n.exists)
    .map(n => idMap.get(`0,${n.c}`)!);

  /*
  storyNodes.push({
    id: startNodeId,
    type: "start",
    label: "Beginning",
    description: "The journey begins. Choose your path.",
    x: 50,
    y: 95,
    edges: startingEdges
  });
  */

  storyNodes.push({
    id: startNodeId,
    type: "enemy",
    label: "Pawn Sentinel",
    difficulty: 1,
    description: "Your journey begins here. A lumbering pawn golem blocks the path.",
    x: 50,
    y: 95,
    edges: startingEdges
  });

  for (let f = 0; f < FLOORS; f++) {
    for (let c = 0; c < COLUMNS; c++) {
      const node = grid[f][c];
      if (!node.exists) continue;

      const edges = f === FLOORS - 1 
        ? [bossId] 
        : node.edges.map(nextC => idMap.get(`${f + 1},${nextC}`)!);

      // Y goes from bottom to top, squished slightly to leave room for the start node
      const baseY = 85 - (f / (FLOORS - 1)) * 75;
      const baseX = 10 + (c / (COLUMNS - 1)) * 80;

      const jitterX = (Math.random() - 0.5) * 4;
      const jitterY = (Math.random() - 0.5) * 2;

      storyNodes.push({
        id: idMap.get(`${f},${c}`)!,
        type: node.type as StoryNodeType,
        label: getLabelForType(node.type as StoryNodeType),
        description: getDescriptionForType(node.type as StoryNodeType),
        difficulty: getDifficultyForType(node.type as StoryNodeType),
        x: Math.max(5, Math.min(95, baseX + jitterX)),
        y: Math.max(10, Math.min(95, baseY + jitterY)),
        edges
      });
    }
  }

  // Boss
  storyNodes.push({
    id: bossId,
    type: "boss",
    label: "The Dark King",
    description: "The ultimate challenge awaits. Defeat the Dark King to complete your journey.",
    difficulty: 3,
    x: 50,
    y: 5,
    edges: []
  });

  return storyNodes;
}

function pickValidRoomType(f: number, c: number, grid: GridNode[][], parents: GridNode[]): StoryNodeType {
  const pool = [
    { type: "puzzle", weight: 22 },
    { type: "rest", weight: 12 },
    { type: "elite", weight: 25 },
    { type: "merchant", weight: 5 },
    { type: "enemy", weight: 36 }
  ];

  if (f < 5) {
    pool.find(p => p.type === "elite")!.weight = 0;
    pool.find(p => p.type === "rest")!.weight = 0;
  }

  const parentTypes = parents.map(p => p.type);
  if (parentTypes.includes("elite")) pool.find(p => p.type === "elite")!.weight = 0;
  if (parentTypes.includes("rest")) pool.find(p => p.type === "rest")!.weight = 0;
  if (parentTypes.includes("merchant")) pool.find(p => p.type === "merchant")!.weight = 0;

  const siblings = grid[f].filter(n => n.exists && n.c !== c);
  const siblingTypes = siblings.map(s => s.type).filter(t => t !== null);
  
  for (const st of siblingTypes) {
    const entry = pool.find(p => p.type === st);
    if (entry) entry.weight = Math.floor(entry.weight * 0.3);
  }

  const totalWeight = pool.reduce((acc, p) => acc + p.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of pool) {
    if (roll < item.weight) {
      return item.type as StoryNodeType;
    }
    roll -= item.weight;
  }

  return "enemy";
}

function getLabelForType(type: StoryNodeType): string {
  switch (type) {
    case "enemy": return "Enemy Encounter";
    case "puzzle": return "Tactics Puzzle";
    case "rest": return "Rest Site";
    case "merchant": return "Wandering Merchant";
    case "elite": return "Elite Enemy";
    default: return "Unknown";
  }
}

function getDescriptionForType(type: StoryNodeType): string {
  switch (type) {
    case "enemy": return "A hostile chess piece blocks your path.";
    case "puzzle": return "Solve a challenging chess tactic to proceed.";
    case "rest": return "A safe haven to recover your strength.";
    case "merchant": return "Exchange your coins for powerful relics.";
    case "elite": return "A formidable foe offering greater rewards.";
    default: return "";
  }
}

function getDifficultyForType(type: StoryNodeType): DifficultyLevel | undefined {
  switch (type) {
    case "enemy": return 1;
    case "puzzle": return 1;
    case "elite": return 2;
    default: return undefined;
  }
}
