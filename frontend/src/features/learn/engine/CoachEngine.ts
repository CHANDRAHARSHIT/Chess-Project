import type { CoachState, CoachEmotion } from "./types";
import type { LessonStep } from "../context/LessonContext";

export class CoachEngine {
  public getInitialResponse(step: LessonStep | null): CoachState {
    if (!step) return { message: "Let's begin.", emotion: "neutral" };
    
    return {
      message: step.coachMessage || "Make your move on the board.",
      emotion: "neutral"
    };
  }

  public getCorrectResponse(step: LessonStep): CoachState {
    return {
      message: step.successMessage || "Brilliant! That is exactly what we were looking for.",
      emotion: "happy"
    };
  }

  public getIncorrectResponse(step: LessonStep, attempts: number): CoachState {
    // 3 attempts total. attempts is the number of REMAINING attempts.
    // So if 3 -> first mistake. 2 -> second. 1 -> third.
    let message = step.failureMessage || "Not quite right. Try again.";
    
    if (attempts === 2) { // 1st mistake
      message = "Interesting idea, but not quite right. Look at the board carefully.";
    } else if (attempts === 1) { // 2nd mistake
      message = step.hint || "Take a closer look at the key squares.";
    } else { // Out of attempts
      message = "Let's reset the board and try a different approach.";
    }

    return {
      message,
      emotion: attempts <= 1 ? "explaining" : "thinking"
    };
  }

  public getHintResponse(step: LessonStep): CoachState {
    return {
      message: step.hint || "Look for forcing moves: checks, captures, or threats.",
      emotion: "explaining"
    };
  }

  public getCompletionResponse(): CoachState {
    return {
      message: "Excellent work! You've mastered this lesson.",
      emotion: "happy"
    };
  }
}
