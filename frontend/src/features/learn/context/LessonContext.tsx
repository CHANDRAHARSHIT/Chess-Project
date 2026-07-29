import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { LessonService } from "../../../services/lesson";
import { LessonEngine } from "../engine/LessonEngine";
import type { LessonEngineState } from "../engine/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LessonStep {
  id: string;
  type: "TEXT" | "BOARD" | "QUIZ" | "CALLOUT" | "COMPLETION";
  title?: string;
  body?: string;
  coachMessage?: string;
  // BOARD
  fen?: string;
  expectedMoves?: string[];
  hint?: string;
  arrows?: { from: string; to: string; color?: string }[];
  highlights?: { square: string; color?: string }[];
  successMessage?: string;
  failureMessage?: string;
  // QUIZ
  quizType?: string;
  question?: string;
  options?: { id: string; text: string }[];
  correct?: string;
  explanation?: string;
  imageUrl?: string;
  // CALLOUT
  category?: string;
  icon?: string;
  [key: string]: any;
}

interface LessonContent {
  version: number;
  title: string;
  steps: LessonStep[];
}

export interface Lesson {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string | null;
  difficulty: string;
  estimatedTime: number;
  category: string;
  content: LessonContent;
  settings?: any;
}

interface LessonContextType {
  lesson: Lesson | null;
  isLoading: boolean;
  error: string | null;

  isIntroShowing: boolean;
  startLesson: () => void;

  // Convenient state shortcuts derived from engineState
  currentStepIndex: number;
  totalSteps: number;
  currentStep: LessonStep | null;
  isCompleted: boolean;

  // Convenient navigation helpers
  goToNextStep: () => void;
  goToPrevStep: () => void;
  goToStep: (index: number) => void;

  // Strict Engine Integration
  engine: LessonEngine;
  engineState: LessonEngineState;
}

const LessonContext = createContext<LessonContextType | undefined>(undefined);

export const useLessonContext = () => {
  const ctx = useContext(LessonContext);
  if (!ctx) throw new Error("useLessonContext must be used within LessonProvider");
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const LessonProvider: React.FC<{ slug: string; children: ReactNode }> = ({ slug, children }) => {
  const engineRef = useRef(new LessonEngine());
  const engine = engineRef.current;
  
  const [engineState, setEngineState] = useState<LessonEngineState>(engine.getState());
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isIntroShowing, setIsIntroShowing] = useState(true);

  // Subscribe to engine state changes
  useEffect(() => {
    const unsubscribe = engine.subscribe(() => {
      setEngineState({ ...engine.getState() });
    });
    return unsubscribe;
  }, [engine]);

  // Fetch lesson
  useEffect(() => {
    const fetchLesson = async () => {
      setIsLoading(true);
      setError(null);
      const res = await LessonService.getLessonBySlug(slug);
      if (res.status === "success" && res.data?.lesson) {
        setLesson(res.data.lesson);
        engine.loadLesson(res.data.lesson);
      } else {
        setError(res.message || "Failed to load lesson.");
      }
      setIsLoading(false);
    };
    fetchLesson();
  }, [slug, engine]);

  const startLesson = () => {
    setIsIntroShowing(false);
    engine.start();
  };

  const currentStepIndex = engineState.currentStepIndex || 0;
  const totalSteps = engineState.totalSteps || (lesson?.content?.steps?.length || 0);
  const currentStep = engineState.currentStep;
  const isCompleted = engineState.status === "completed";

  const goToNextStep = () => engine.nextStep();
  const goToPrevStep = () => engine.prevStep();
  const goToStep = (index: number) => engine.goToStep(index);

  return (
    <LessonContext.Provider value={{
      lesson, isLoading, error,
      isIntroShowing, startLesson,
      currentStepIndex, totalSteps, currentStep, isCompleted,
      goToNextStep, goToPrevStep, goToStep,
      engine, engineState
    }}>
      {children}
    </LessonContext.Provider>
  );
};
