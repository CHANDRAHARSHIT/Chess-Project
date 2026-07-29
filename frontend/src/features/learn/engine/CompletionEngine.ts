import type { LessonStats, LessonEngineState } from "./types";

export class CompletionEngine {
  private readonly MAX_XP = 50;

  public calculateCompletion(state: LessonEngineState): LessonStats {
    const totalPracticeSteps = state.lesson?.content?.steps.filter(s => s.type === "BOARD" || s.type === "QUIZ").length || 1;
    const { mistakes, hintsUsed, timeSpent } = state.stats;

    // Accuracy calculation: Each mistake reduces accuracy by 10%, maxing out at 0%
    const penaltyPerMistake = 100 / (totalPracticeSteps * 2); 
    const calculatedAccuracy = Math.max(0, 100 - (mistakes * penaltyPerMistake));
    const accuracy = Math.round(calculatedAccuracy);

    // XP calculation: Based on accuracy, minus hint penalties
    let xpEarned = Math.round(this.MAX_XP * (accuracy / 100));
    xpEarned = Math.max(0, xpEarned - (hintsUsed * 5)); // 5 XP penalty per hint

    return {
      ...state.stats,
      accuracy,
      xpEarned,
      isCompleted: true,
    };
  }

  public getBadges(stats: LessonStats) {
    return {
      perfectRun: stats.mistakes === 0 && stats.hintsUsed === 0,
      speedRunner: stats.timeSpent < 60 && stats.accuracy >= 80, // under 1 minute
    };
  }
}
