export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface DifficultyConfig {
  level: DifficultyLevel;
  name: string;
  skillLevel: number; // Stockfish "Skill Level" option (0 - 20)
  depth: number;      // Engine depth limit
  timeLimit: number;  // Engine time limit in ms
  description: string;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  1: {
    level: 1,
    name: "Beginner",
    skillLevel: 0,
    depth: 1,
    timeLimit: 150,
    description: "Ideal for players learning the basic concepts."
  },
  2: {
    level: 2,
    name: "Casual",
    skillLevel: 5,
    depth: 3,
    timeLimit: 300,
    description: "A friendly sparring partner for casual play."
  },
  3: {
    level: 3,
    name: "Intermediate",
    skillLevel: 10,
    depth: 6,
    timeLimit: 600,
    description: "Plays steady, club-level chess with fewer blunders."
  },
  4: {
    level: 4,
    name: "Advanced",
    skillLevel: 15,
    depth: 10,
    timeLimit: 1200,
    description: "A formidable challenger with positional awareness."
  },
  5: {
    level: 5,
    name: "Master",
    skillLevel: 20,
    depth: 15,
    timeLimit: 2500,
    description: "Stockfish at full strength. Grandmaster level tactics."
  }
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
