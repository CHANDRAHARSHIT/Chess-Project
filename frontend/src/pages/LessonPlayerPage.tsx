import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { LessonProvider, useLessonContext } from "../features/learn/context/LessonContext";
import { StepRenderer } from "../features/learn/components/StepRenderer";
import { LessonTimeline } from "../features/learn/components/LessonTimeline";
import { LessonSidebar } from "../features/learn/components/LessonSidebar";
import { LessonIntroScreen } from "../features/learn/components/LessonIntroScreen";
import { ChevronLeft, ChevronRight, Keyboard, CheckCircle } from "lucide-react";

// ─── Step type badge for header ───────────────────────────────────────────────
const stepTypeBadge: Record<string, { label: string; color: string }> = {
  TEXT: { label: "Reading", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  BOARD: { label: "Practice", color: "bg-[#D4AF6E]/15 text-[#D4AF6E] border-[#D4AF6E]/30" },
  QUIZ: { label: "Quiz", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  CALLOUT: { label: "Insight", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  COMPLETION: { label: "Complete", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

// ─── Progress dots ─────────────────────────────────────────────────────────────
const ProgressDots: React.FC = () => {
  const { lesson, currentStepIndex, goToStep } = useLessonContext();
  const steps = lesson?.content?.steps || [];

  return (
    <div className="flex items-center gap-1.5">
      {steps.map((step, i) => {
        const isActive = i === currentStepIndex;
        const isDone = i < currentStepIndex;
        return (
          <button
            key={step.id}
            onClick={() => goToStep(i)}
            title={`Step ${i + 1}`}
            className="relative flex items-center justify-center focus:outline-none group"
          >
            <motion.div
              animate={{
                width: isActive ? 24 : 8,
                backgroundColor: isDone ? "#D4AF6E" : isActive ? "#D4AF6E" : "rgba(255,255,255,0.15)",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="h-2 rounded-full"
            />
          </button>
        );
      })}
    </div>
  );
};

// ─── Main player content ───────────────────────────────────────────────────────
const LessonPlayerContent: React.FC = () => {
  const {
    lesson, isLoading, error,
    isIntroShowing,
    currentStepIndex = 0, totalSteps = 1, currentStep,
    goToNextStep, goToPrevStep,
    engineState
  } = useLessonContext();
  const navigate = useNavigate();

  const isStepCompleted = engineState.status === "completed" || currentStep?.type === "TEXT" || currentStep?.type === "CALLOUT";
  const isCompletionStep = currentStep?.type === "COMPLETION";

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (isStepCompleted && !isCompletionStep) goToNextStep();
      }
      if (e.key === "ArrowLeft") goToPrevStep();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goToNextStep, goToPrevStep, isStepCompleted, isCompletionStep]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080B14] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF6E]/20 border-t-[#D4AF6E] animate-spin mb-2" />
        <div className="text-sm font-semibold text-[#D4AF6E] tracking-wide animate-pulse">Loading Masterclass...</div>
      </div>
    );
  }

  // ── Error ──
  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-[#080B14] flex flex-col items-center justify-center gap-6">
        <div className="text-xl text-white/80 font-medium">{error || "Lesson not found"}</div>
        <button onClick={() => navigate("/learn")} className="px-6 py-3 bg-[#D4AF6E] text-[#080B14] font-bold rounded-xl hover:bg-[#B8934A] transition-colors">
          Back to Courses
        </button>
      </div>
    );
  }

  // ── Intro Screen ──
  if (isIntroShowing) return <LessonIntroScreen />;

  const badge = currentStep ? stepTypeBadge[currentStep.type] : null;
  const isBoardStep = currentStep?.type === "BOARD";
  const displayStep = (currentStepIndex || 0) + 1;
  const safeTotalSteps = totalSteps || (lesson?.content?.steps?.length || 1);

  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col relative overflow-hidden select-none">
      {/* Subtle radial bg & noise texture */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(212,175,110,0.1),transparent)] pointer-events-none" />
      <div className="fixed inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF6E]/30 to-transparent z-50" />

      {/* ── Fixed Header ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 md:px-6
        bg-[#080B14]/90 backdrop-blur-xl border-b border-white/[0.08]">

        {/* Back Button */}
        <button
          onClick={() => navigate("/learn")}
          className="flex-shrink-0 p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all group mr-3"
          title="Back to Courses"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* Lesson title + type badge */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h1 className="text-sm font-bold text-white truncate">{lesson.title}</h1>
          {badge && (
            <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase tracking-wider flex-shrink-0 ${badge.color}`}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Progress dots (center) */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2">
          <ProgressDots />
        </div>

        {/* Step counter */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs font-mono font-bold text-[#D4AF6E]">
            {displayStep} <span className="text-white/20">/</span> {safeTotalSteps}
          </span>
        </div>
      </header>

      {/* ── Body (3 columns) ────────────────────────────────────────────── */}
      <div className="flex flex-1 pt-14 pb-16 min-h-screen">

        {/* LEFT PANEL — Timeline */}
        <aside className="hidden xl:flex flex-col w-[230px] flex-shrink-0 border-r border-white/[0.06] pt-6 pb-6 px-3 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <LessonTimeline />
        </aside>

        {/* CENTER STAGE */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full mx-auto ${isBoardStep ? "max-w-5xl" : "max-w-3xl"} px-5 py-10`}
            >
              <StepRenderer />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* RIGHT PANEL — Sidebar */}
        <aside className="hidden xl:flex flex-col w-[270px] flex-shrink-0 border-l border-white/[0.06] pt-6 pb-6 px-3 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <LessonSidebar />
        </aside>
      </div>

      {/* ── Fixed Footer ────────────────────────────────────────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-5
        bg-[#080B14]/95 backdrop-blur-xl border-t border-white/[0.08]">

        {/* Previous Button */}
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={goToPrevStep}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-0 disabled:pointer-events-none transition-all text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </motion.button>

        {/* Shortcut hint */}
        <div className="hidden md:flex items-center gap-1.5 text-white/20 text-[10px] font-mono">
          <Keyboard className="w-3.5 h-3.5 text-[#D4AF6E]" />
          <span>Use ← → keys or Enter</span>
        </div>

        {/* Next / Continue Button */}
        {!isCompletionStep ? (
          <motion.button
            whileHover={isStepCompleted ? { scale: 1.02, boxShadow: "0 0 25px rgba(212,175,110,0.3)" } : {}}
            whileTap={isStepCompleted ? { scale: 0.96 } : {}}
            onClick={goToNextStep}
            disabled={!isStepCompleted}
            className={`flex items-center gap-2 px-7 py-2.5 rounded-xl font-extrabold text-sm transition-all shadow-lg ${
              isStepCompleted
                ? "bg-[#D4AF6E] text-[#080B14] hover:bg-[#B8934A] cursor-pointer shadow-[0_0_20px_rgba(212,175,110,0.25)]"
                : "bg-white/10 text-white/30 cursor-not-allowed border border-white/5"
            }`}
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(212,175,110,0.3)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/learn")}
            className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#E8C88A] to-[#D4AF6E] text-[#080B14] font-extrabold text-sm shadow-[0_0_20px_rgba(212,175,110,0.25)] transition-all"
          >
            <span>Finish Masterclass</span>
            <CheckCircle className="w-4 h-4" />
          </motion.button>
        )}
      </footer>
    </div>
  );
};

// ─── Page export ──────────────────────────────────────────────────────────────
export default function LessonPlayerPage() {
  const { slug } = useParams();
  if (!slug) return null;
  return (
    <LessonProvider slug={slug}>
      <LessonPlayerContent />
    </LessonProvider>
  );
}
