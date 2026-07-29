import React, { useState } from "react";
import { useLessonContext } from "../context/LessonContext";
import { Clock, Target, AlertCircle, Lightbulb, BookMarked, Star, Edit3, BookmarkPlus } from "lucide-react";

const StatPill: React.FC<{ icon: React.ReactNode; label: string; value: string | number; accent?: boolean }> = ({
  icon, label, value, accent = false
}) => (
  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
    accent ? "bg-[#D4AF6E]/10 border-[#D4AF6E]/25 shadow-sm" : "bg-white/[0.03] border-white/5"
  }`}>
    <div className="flex items-center gap-2.5">
      <span className={accent ? "text-[#D4AF6E]" : "text-white/40"}>{icon}</span>
      <span className="text-xs text-white/40 font-medium">{label}</span>
    </div>
    <span className={`text-sm font-bold font-mono ${accent ? "text-[#D4AF6E]" : "text-white/80"}`}>{value}</span>
  </div>
);

export const LessonSidebar: React.FC = () => {
  const { lesson, engineState } = useLessonContext();
  const { currentStepIndex = 0, totalSteps = 1, stats } = engineState;
  const { timeSpent = 0, mistakes = 0, hintsUsed = 0, xpEarned = 0, isCompleted = false } = stats || {};
  const [notes, setNotes] = useState("");
  const [bookmarked, setBookmarked] = useState(false);

  const formatTime = (s: number) => {
    const safeS = isNaN(s) ? 0 : s;
    const m = Math.floor(safeS / 60);
    const sec = safeS % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const stepsCount = totalSteps || 1;
  const accuracy = stepsCount > 0
    ? Math.max(0, Math.min(100, Math.round(((stepsCount - mistakes) / stepsCount) * 100)))
    : 100;

  const xpDisplay = isCompleted ? xpEarned : Math.round(50 * (accuracy / 100));

  // Pull objectives from lesson content or use defaults
  const objectives: string[] = lesson?.settings?.objectives || [
    "Complete all lesson steps",
    "Practice board positions",
    "Master the final quiz",
  ];

  const currentDisplayStep = (currentStepIndex || 0) + 1;

  return (
    <aside className="flex flex-col gap-4 h-full overflow-y-auto pr-1 pb-10 select-none">
      {/* Lesson Meta */}
      <div className="bg-white/[0.02] border border-[#D4AF6E]/15 rounded-2xl p-4 relative overflow-hidden backdrop-blur-md">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,110,0.08),transparent)] pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#D4AF6E]">
            Lesson Metrics
          </p>
          <button 
            onClick={() => setBookmarked(!bookmarked)}
            className={`p-1.5 rounded-md transition-colors ${bookmarked ? 'bg-[#D4AF6E]/20 text-[#D4AF6E]' : 'text-white/30 hover:bg-white/5 hover:text-white/80'}`}
            title="Bookmark Lesson"
          >
            <BookmarkPlus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2 relative z-10">
          <StatPill
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Time Spent"
            value={formatTime(timeSpent)}
          />
          <StatPill
            icon={<Target className="w-3.5 h-3.5" />}
            label="Accuracy"
            value={`${isNaN(accuracy) ? 100 : accuracy}%`}
            accent={accuracy >= 80}
          />
          <StatPill
            icon={<Star className="w-3.5 h-3.5" />}
            label="XP Earned"
            value={`+${isNaN(xpDisplay) ? 50 : xpDisplay}`}
            accent
          />
          <StatPill
            icon={<AlertCircle className="w-3.5 h-3.5" />}
            label="Mistakes"
            value={mistakes}
          />
          <StatPill
            icon={<Lightbulb className="w-3.5 h-3.5" />}
            label="Hints Used"
            value={hintsUsed}
          />
        </div>
      </div>

      {/* Objectives */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-3">
          Lesson Goals
        </p>
        <div className="flex flex-col gap-3">
          {objectives.map((obj: string, i: number) => {
            const done = i < currentStepIndex;
            return (
              <div key={i} className="flex items-start gap-2.5 group">
                <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center border transition-colors ${
                  done ? "bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_8px_rgba(52,211,153,0.3)]" : "border-white/10 group-hover:border-[#D4AF6E]/40"
                }`}>
                  {done && <span className="text-[8px] text-emerald-400 font-bold">✓</span>}
                </div>
                <span className={`text-xs leading-relaxed transition-colors ${done ? "line-through text-white/30" : "text-white/70 group-hover:text-white"}`}>
                  {obj}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personal Notes */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-3 flex items-center gap-1.5">
          <Edit3 className="w-3 h-3 text-[#D4AF6E]" />
          Personal Notes
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down key takeaways here..."
          className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white/90 focus:outline-none focus:border-[#D4AF6E]/50 focus:ring-1 focus:ring-[#D4AF6E]/20 placeholder:text-white/20 resize-none transition-all"
        />
      </div>

      {/* Key Terms */}
      {lesson?.settings?.keyTerms && (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-3 flex items-center gap-1.5">
            <BookMarked className="w-3 h-3 text-[#D4AF6E]" />
            Key Concepts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lesson.settings.keyTerms.map((term: string, i: number) => (
              <span key={i} className="px-2 py-1 rounded-lg bg-[#D4AF6E]/10 border border-[#D4AF6E]/20 text-[10px] text-[#D4AF6E] font-mono hover:bg-[#D4AF6E]/20 transition-colors cursor-default">
                {term}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Lesson Details */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-3">
          Overview
        </p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Difficulty</span>
            <span className="text-xs text-white/80 font-medium">{lesson?.difficulty || "Beginner"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Category</span>
            <span className="text-xs text-[#D4AF6E] font-medium">{lesson?.category}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Est. Time</span>
            <span className="text-xs text-white/80 font-medium">{lesson?.estimatedTime}m</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Progress</span>
            <span className="text-xs text-[#D4AF6E] font-bold font-mono">{currentDisplayStep} / {stepsCount}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
