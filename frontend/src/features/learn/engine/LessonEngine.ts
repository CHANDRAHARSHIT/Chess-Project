import type { Lesson, LessonStep } from "../context/LessonContext";
import type { LessonEngineState, LessonStats, StepStats, BoardState, CoachState } from "./types";
import { ChessEngine } from "./ChessEngine";
import { LessonValidator } from "./LessonValidator";
import { CoachEngine } from "./CoachEngine";
import { HintEngine } from "./HintEngine";
import { CompletionEngine } from "./CompletionEngine";
import { ProgressManager } from "./ProgressManager";

export class LessonEngine {
  private state: LessonEngineState;
  private listeners: Set<() => void> = new Set();
  
  private chess = new ChessEngine();
  private validator = new LessonValidator();
  private coachEngine = new CoachEngine();
  private hintEngine = new HintEngine();
  private completionEngine = new CompletionEngine();
  private progressManager = new ProgressManager();

  private moveSequenceIndex: number = 0;
  private saveTimeout: any = null;
  private clockInterval: any = null;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): LessonEngineState {
    return {
      status: "idle",
      lesson: null,
      currentStepIndex: 0,
      totalSteps: 0,
      currentStep: null,
      stepStats: { attempts: 3, mistakes: 0, hintsUsed: 0 },
      boardState: { fen: "start", lastMove: null, history: [] },
      coach: { message: "Loading...", emotion: "neutral" },
      stats: { timeSpent: 0, mistakes: 0, hintsUsed: 0, xpEarned: 0, accuracy: 100, isCompleted: false }
    };
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // --- External API ---

  public loadLesson(lesson: Lesson) {
    const saved = this.progressManager.loadProgress(lesson.id);
    const startIndex = (saved && typeof saved.currentStepIndex === "number" && saved.currentStepIndex < lesson.content.steps.length)
      ? saved.currentStepIndex
      : 0;
    const initialStats = saved ? saved.stats : this.getInitialState().stats;

    this.state = {
      ...this.getInitialState(),
      status: "idle",
      lesson,
      totalSteps: lesson.content.steps.length,
      currentStepIndex: startIndex,
      stats: {
        timeSpent: initialStats.timeSpent || 0,
        mistakes: initialStats.mistakes || 0,
        hintsUsed: initialStats.hintsUsed || 0,
        xpEarned: initialStats.xpEarned || 0,
        accuracy: typeof initialStats.accuracy === "number" && !isNaN(initialStats.accuracy) ? initialStats.accuracy : 100,
        isCompleted: !!initialStats.isCompleted
      }
    };

    this.loadStep(startIndex);
  }

  public start() {
    this.state.status = "playing";
    this.startClock();
    this.notify();
  }

  public nextStep() {
    if (!this.state.lesson) return;
    const nextIdx = this.state.currentStepIndex + 1;
    
    if (nextIdx < this.state.totalSteps) {
      this.state.currentStepIndex = nextIdx;
      this.loadStep(nextIdx);
      this.scheduleSave();
    } else {
      this.completeLesson();
    }
  }

  public prevStep() {
    if (this.state.currentStepIndex > 0) {
      const prevIdx = this.state.currentStepIndex - 1;
      this.state.currentStepIndex = prevIdx;
      this.loadStep(prevIdx);
      this.scheduleSave();
    }
  }

  public goToStep(index: number) {
    if (index >= 0 && index < this.state.totalSteps) {
      this.state.currentStepIndex = index;
      this.loadStep(index);
      this.scheduleSave();
    }
  }

  // --- Board & Physics Methods ---

  public getLegalMoves(square: string): string[] {
    this.chess.setFen(this.state.boardState.fen);
    return this.chess.getLegalMoves(square);
  }

  public handleMove(source: string, target: string, promotion: string = "q"): boolean {
    const { status, currentStep, stepStats, boardState } = this.state;
    if ((status !== "playing" && status !== "validating") || !currentStep || currentStep.type !== "BOARD") return false;
    if (stepStats.attempts <= 0) return false;

    // 1. Check physical legality
    this.chess.setFen(boardState.fen);
    const move = this.chess.attemptMove(source, target, promotion);
    if (!move) return false; // illegal move physically

    // 2. Apply player's move to state
    const newFen = this.chess.getFen();
    this.state.boardState.history.push(boardState.fen);
    this.state.boardState.fen = newFen;
    this.state.boardState.lastMove = { from: source, to: target };
    this.state.status = "validating";
    this.notify();

    // 3. Validate correctness against expected moves
    const expected = currentStep.expectedMoves || [];
    const targetMove = expected[this.moveSequenceIndex] || expected[0];

    setTimeout(() => {
      const isCorrect = !targetMove || targetMove === move.lan || expected.includes(move.lan);

      if (isCorrect) {
        this.moveSequenceIndex += 1;
        const botResponseMove = expected[this.moveSequenceIndex];

        // Check if there is an automated bot response move in sequence
        if (botResponseMove && botResponseMove.length >= 4) {
          setTimeout(() => {
            const bFrom = botResponseMove.substring(0, 2);
            const bTo = botResponseMove.substring(2, 4);
            const bProm = botResponseMove[4] || "q";
            
            this.chess.setFen(this.state.boardState.fen);
            const bMove = this.chess.attemptMove(bFrom, bTo, bProm);
            if (bMove) {
              this.state.boardState.history.push(this.state.boardState.fen);
              this.state.boardState.fen = this.chess.getFen();
              this.state.boardState.lastMove = { from: bFrom, to: bTo };
            }
            
            this.moveSequenceIndex += 1;
            
            // Check if full sequence finished
            if (this.moveSequenceIndex >= expected.length) {
              this.state.status = "completed";
              this.state.coach = this.coachEngine.getCorrectResponse(currentStep);
            } else {
              this.state.status = "playing";
            }
            this.notify();
          }, 350);
        } else {
          this.state.status = "completed";
          this.state.coach = this.coachEngine.getCorrectResponse(currentStep);
        }
      } else {
        // Mistake made
        this.state.stepStats.attempts = Math.max(0, this.state.stepStats.attempts - 1);
        this.state.stepStats.mistakes += 1;
        this.state.stats.mistakes += 1;
        this.state.coach = this.coachEngine.getIncorrectResponse(currentStep, this.state.stepStats.attempts);
        
        // Revert board after 1.2s so user sees why it failed
        setTimeout(() => {
          if (this.state.boardState.history.length > 0) {
            this.state.boardState.fen = this.state.boardState.history.pop()!;
            this.state.boardState.lastMove = null;
          }
          this.state.status = "playing";
          this.state.coach = this.coachEngine.getInitialResponse(currentStep);
          this.notify();
        }, 1200);
      }
      this.scheduleSave();
      this.notify();
    }, 250);

    return true;
  }

  public undoMove() {
    const { boardState, status } = this.state;
    if ((status === "playing" || status === "completed") && boardState.history.length > 0) {
      boardState.fen = boardState.history.pop()!;
      boardState.lastMove = null;
      this.state.status = "playing";
      this.moveSequenceIndex = Math.max(0, this.moveSequenceIndex - 1);
      this.state.coach = this.coachEngine.getInitialResponse(this.state.currentStep);
      this.notify();
    }
  }

  public resetBoard() {
    if (this.state.currentStep?.type === "BOARD") {
      const fen = this.state.currentStep.fen || "start";
      this.moveSequenceIndex = 0;
      this.state.boardState = { fen, history: [fen], lastMove: null };
      this.state.stepStats = { attempts: 3, mistakes: 0, hintsUsed: 0 };
      this.state.status = "playing";
      this.state.coach = this.coachEngine.getInitialResponse(this.state.currentStep);
      this.notify();
    }
  }

  public requestHint() {
    const { currentStep, stepStats } = this.state;
    if (!currentStep) return;

    stepStats.hintsUsed += 1;
    this.state.stats.hintsUsed += 1;
    this.state.coach = this.coachEngine.getHintResponse(currentStep);
    this.scheduleSave();
    this.notify();
  }

  // --- Quiz Interactions ---
  
  public handleQuizOption(optionId: string): boolean {
    const { currentStep } = this.state;
    if (!currentStep || currentStep.type !== "QUIZ") return false;

    const isCorrect = this.validator.validateQuiz(currentStep, optionId);
    
    if (isCorrect) {
      this.state.status = "completed";
      this.state.coach = {
        message: `**Correct!**\n\n${currentStep.explanation || "Well done!"}`,
        emotion: "happy"
      };
    } else {
      this.state.stats.mistakes += 1;
      this.state.stepStats.mistakes += 1;
    }
    this.scheduleSave();
    this.notify();
    return isCorrect;
  }

  // --- Internal Utilities ---

  private loadStep(index: number) {
    if (!this.state.lesson) return;
    const step = this.state.lesson.content.steps[index];
    
    this.moveSequenceIndex = 0;
    this.state.currentStep = step;
    this.state.stepStats = { attempts: 3, mistakes: 0, hintsUsed: 0 };
    
    if (step.type === "BOARD" && step.fen) {
      this.state.boardState = { fen: step.fen, history: [step.fen], lastMove: null };
      this.chess.setFen(step.fen);
    }
    
    // For non-interactive steps (TEXT, CALLOUT), step is completed immediately or upon click
    if (step.type === "TEXT" || step.type === "CALLOUT") {
      this.state.status = "completed";
    } else {
      this.state.status = "playing";
    }

    this.state.coach = this.coachEngine.getInitialResponse(step);
    
    if (step.type === "COMPLETION") {
      this.completeLesson();
    }
    
    this.notify();
  }

  private completeLesson() {
    this.stopClock();
    const finalStats = this.completionEngine.calculateCompletion(this.state);
    this.state.stats = finalStats;
    this.state.status = "completed";
    this.state.coach = this.coachEngine.getCompletionResponse();
    
    if (this.state.lesson) {
      this.progressManager.completeLesson(this.state.lesson.id, finalStats);
    }
    this.notify();
  }

  private startClock() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.clockInterval = setInterval(() => {
      if (this.state.status !== "completed") {
        this.state.stats.timeSpent += 1;
        this.notify();
      }
    }, 1000);
  }

  private stopClock() {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  private scheduleSave() {
    if (!this.state.lesson) return;
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    
    this.saveTimeout = setTimeout(() => {
      this.progressManager.saveProgress(
        this.state.lesson!.id, 
        this.state.currentStepIndex, 
        this.state.stats
      );
    }, 1500);
  }

  public getState(): LessonEngineState {
    return this.state;
  }
}
