export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface DifficultyConfig {
  level: DifficultyLevel;
  name: string;
  rating: string;       // Display rating label
  skillLevel: number;   // Stockfish "Skill Level" option (0 - 20)
  depth: number;        // Engine depth limit
  timeLimit: number;    // Engine time limit in ms
  description: string;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  1: {
    level: 1,
    name: "Beginner",
    rating: "800",
    skillLevel: 0,
    depth: 1,
    timeLimit: 150,
    description: "Ideal for players learning the basic concepts."
  },
  2: {
    level: 2,
    name: "Easy",
    rating: "1200",
    skillLevel: 4,
    depth: 3,
    timeLimit: 300,
    description: "A friendly sparring partner for casual play."
  },
  3: {
    level: 3,
    name: "Intermediate",
    rating: "1600",
    skillLevel: 8,
    depth: 6,
    timeLimit: 600,
    description: "Plays steady club-level chess with fewer blunders."
  },
  4: {
    level: 4,
    name: "Advanced",
    rating: "2000",
    skillLevel: 14,
    depth: 10,
    timeLimit: 1200,
    description: "A formidable challenger with positional awareness."
  },
  5: {
    level: 5,
    name: "Master",
    rating: "3000+",
    skillLevel: 20,
    depth: 20,
    timeLimit: 3000,
    description: "Maximum engine power. Virtually unbeatable."
  },
};

export interface EngineEvaluation {
  type: 'cp' | 'mate';
  value: number; // centipawns or moves to mate
}

export type EngineStatus = 'idle' | 'ready' | 'thinking' | 'analyzing' | 'error';

export interface MoveLogEntry {
  san: string;        // Standard Algebraic Notation, e.g. "e4"
  from: string;       // e.g. "e2"
  to: string;         // e.g. "e4"
  color: 'w' | 'b';
  piece: string;      // e.g. "p"
  moveNumber: number;
}

/** High-level lifecycle state for the Chess960 game page */
export type GameStatus =
  | 'idle'       // No game started — setup panel is visible
  | 'playing'    // Game in progress
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'resigned';

/** Winner from the display layer's perspective */
export type GameResult = 'white' | 'black' | 'draw' | null;

