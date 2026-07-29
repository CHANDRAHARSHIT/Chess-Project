import React from "react";
import { useLessonContext } from "../context/LessonContext";
import { TextStep } from "./steps/TextStep";
import { BoardStep } from "./steps/BoardStep";
import { QuizStep } from "./steps/QuizStep";
import { CalloutStep } from "./steps/CalloutStep";
import { CompletionStep } from "./steps/CompletionStep";

export const StepRenderer: React.FC = () => {
  const { engineState } = useLessonContext();
  const { currentStep } = engineState;

  if (!currentStep) return null;

  switch (currentStep.type) {
    case "TEXT":
      return <TextStep step={currentStep} />;
    case "BOARD":
      return <BoardStep step={currentStep} />;
    case "QUIZ":
      return <QuizStep step={currentStep} />;
    case "CALLOUT":
      return <CalloutStep step={currentStep} />;
    case "COMPLETION":
      return <CompletionStep step={currentStep} />;
    default:
      return (
        <div className="p-4 border border-red-500 text-red-500 rounded-lg">
          Unknown step type: {currentStep.type}
        </div>
      );
  }
};
