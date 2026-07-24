export type PuzzleTileState = 'locked' | 'current' | 'completed';

export interface PathNode {
  id: string;
  levelNumber: number;
  /** Horizontal position as percentage (0 - 100%) across pathway canvas width */
  x: number;
  /** Vertical position as percentage (0 - 100%) down pathway canvas height */
  y: number;
  fen?: string;
  solution?: string;
  rating?: number;
  title?: string;
  description?: string;
}

export interface PlayerProgress {
  completedPuzzleIds: string[];
  currentPuzzleId: string;
  streak: number;
  totalSolved: number;
}

export interface PathwayComponentProps {
  playerProgress: PlayerProgress;
  onSelectPuzzle: (node: PathNode) => void;
  activePuzzleId?: string;
}
