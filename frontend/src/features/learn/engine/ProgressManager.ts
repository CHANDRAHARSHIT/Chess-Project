import { LessonService } from "../../../services/lesson";
import type { LessonStats } from "./types";

export class ProgressManager {
  private getLocalKey(lessonId: string): string {
    return `xlchess_lesson_progress_${lessonId}`;
  }

  /**
   * Persists ongoing lesson progress to LocalStorage and Backend.
   */
  public async saveProgress(lessonId: string, currentStepIndex: number, stats: LessonStats): Promise<void> {
    // 1. Save to LocalStorage for immediate resilience
    try {
      const data = JSON.stringify({ currentStepIndex, stats, timestamp: Date.now() });
      localStorage.setItem(this.getLocalKey(lessonId), data);
    } catch (e) {
      console.error("Failed to save progress to localStorage", e);
    }

    // 2. Sync to Backend (debounced by the caller or engine)
    try {
      await LessonService.updateProgress(lessonId, {
        currentStep: currentStepIndex,
        timeSpent: stats.timeSpent,
        mistakes: stats.mistakes
      });
    } catch (e) {
      console.error("Failed to sync progress to backend", e);
    }
  }

  /**
   * Completes the lesson persistently.
   */
  public async completeLesson(lessonId: string, stats: LessonStats): Promise<void> {
    // We can also store completion details in localstorage
    try {
      localStorage.removeItem(this.getLocalKey(lessonId)); // Clean up ongoing progress
      localStorage.setItem(`xlchess_lesson_completed_${lessonId}`, JSON.stringify(stats));
    } catch (e) {
      // ignore
    }

    // Sync to Backend
    try {
      await LessonService.completeLesson(lessonId, {
        xp: stats.xpEarned,
        accuracy: stats.accuracy,
        timeSpent: stats.timeSpent,
        mistakes: stats.mistakes
      });
    } catch (e) {
      console.error("Failed to sync completion to backend", e);
    }
  }

  /**
   * Loads saved progress from LocalStorage if available.
   */
  public loadProgress(lessonId: string): { currentStepIndex: number; stats: LessonStats } | null {
    try {
      const saved = localStorage.getItem(this.getLocalKey(lessonId));
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return null;
  }
}
