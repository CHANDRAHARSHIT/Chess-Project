import type { LessonStep } from "../context/LessonContext";

export class LessonValidator {
  /**
   * Validates if the played move in UCI/LAN format (e.g. 'e2e4') 
   * is in the step's expected moves.
   */
  public validateMove(step: LessonStep, lanMove: string): boolean {
    if (step.type !== "BOARD") return false;
    if (!step.expectedMoves || step.expectedMoves.length === 0) return true; // If no expected moves are set, anything goes

    return step.expectedMoves.includes(lanMove);
  }

  /**
   * Validates if the selected quiz option is correct.
   */
  public validateQuiz(step: LessonStep, optionId: string): boolean {
    if (step.type !== "QUIZ") return false;
    return step.correct === optionId;
  }
}
