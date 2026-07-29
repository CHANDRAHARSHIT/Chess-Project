import type { LessonStep } from "../context/LessonContext";

export class HintEngine {
  /**
   * Calculates the XP penalty for using a hint.
   * Could scale based on lesson difficulty or hint level.
   */
  public getHintPenalty(step: LessonStep): number {
    return 5;
  }

  /**
   * For the future, returns which square/arrow to highlight
   * if it's an advanced hint level.
   */
  public getVisualHint(step: LessonStep, hintLevel: number) {
    if (hintLevel >= 2 && step.expectedMoves && step.expectedMoves.length > 0) {
      const uci = step.expectedMoves[0];
      const from = uci.substring(0, 2);
      const to = uci.substring(2, 4);
      return { type: hintLevel === 2 ? "square" : "arrow", from, to };
    }
    return null;
  }
}
