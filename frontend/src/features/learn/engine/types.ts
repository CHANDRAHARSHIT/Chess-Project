import type { Lesson, LessonStep } from "../context/LessonContext";

export type EngineStatus = "idle" | "playing" | "validating" | "completed";
export type CoachEmotion = "neutral" | "happy" | "thinking" | "explaining";

export interface BoardState {
  fen: string;
  lastMove: { from: string; to: string } | null;
  history: string[]; // List of FENs for undo
}

export interface StepStats {
  attempts: number;
  mistakes: number;
  hintsUsed: number;
}

export interface LessonStats {
  timeSpent: number; // in seconds
  mistakes: number;
  hintsUsed: number;
  xpEarned: number;
  accuracy: number;
  isCompleted: boolean;
}

export interface CoachState {
  message: string;
  emotion: CoachEmotion;
}

export interface LessonEngineState {
  status: EngineStatus;
  lesson: Lesson | null;
  currentStepIndex: number;
  totalSteps: number;
  
  // Active step details
  currentStep: LessonStep | null;
  stepStats: StepStats;
  boardState: BoardState;
  coach: CoachState;
  
  // Aggregate stats
  stats: LessonStats;
}
