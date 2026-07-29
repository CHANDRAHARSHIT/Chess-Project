import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLessonContext } from "../context/LessonContext";
import { BookOpen, Swords, HelpCircle, Zap, Trophy, CheckCircle2 } from "lucide-react";
import type { LessonStep } from "../context/LessonContext";

const stepTypeConfig: Record<LessonStep["type"], { icon: React.FC<any>; label: string; color: string }> = {
  TEXT: { icon: BookOpen, label: "Reading", color: "text-blue-400" },
  BOARD: { icon: Swords, label: "Practice", color: "text-[#D4AF6E]" },
  QUIZ: { icon: HelpCircle, label: "Quiz", color: "text-purple-400" },
  CALLOUT: { icon: Zap, label: "Insight", color: "text-amber-400" },
  COMPLETION: { icon: Trophy, label: "Complete", color: "text-emerald-400" },
};

export const LessonTimeline: React.FC = () => {
  const { lesson, engine, engineState } = useLessonContext();
  const { currentStepIndex, totalSteps } = engineState;
  const steps = lesson?.content?.steps || [];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <nav className="flex flex-col gap-1 w-full relative">
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/30 mb-3 px-2">
        Lesson Steps
      </p>
      {steps.map((step, i) => {
        const config = stepTypeConfig[step.type] || stepTypeConfig.TEXT;
        const Icon = config.icon;
        const isActive = i === currentStepIndex;
        const isCompleted = i < currentStepIndex;
        const isLocked = i > currentStepIndex;
        const isHovered = hoveredIndex === i;

        return (
          <div 
            key={step.id} 
            className="relative"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <motion.button
              onClick={() => engine.goToStep(i)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              className={`
                group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200
                ${isActive
                  ? "bg-[#D4AF6E]/10 border border-[#D4AF6E]/30"
                  : isCompleted
                    ? "hover:bg-white/5 border border-transparent cursor-pointer"
                    : "hover:bg-white/5 border border-transparent opacity-60 cursor-pointer"
                }
              `}
            >
              {/* Left accent bar for active */}
              {isActive && (
                <motion.div
                  layoutId="timeline-active"
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#D4AF6E]"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}

              {/* Icon circle */}
              <div className={`
                relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
                ${isActive ? "bg-[#D4AF6E]/20 shadow-[0_0_10px_rgba(212,175,110,0.2)]" : isCompleted ? "bg-white/5" : "bg-white/5"}
              `}>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#D4AF6E]" : isLocked ? "text-white/30" : config.color}`} />
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate transition-colors ${
                  isActive ? "text-[#D4AF6E]" : isCompleted ? "text-white/70" : "text-white/60"
                }`}>
                  {step.title || config.label}
                </p>
                <p className={`text-[10px] mt-0.5 transition-colors ${isActive ? "text-[#D4AF6E]/50" : "text-white/25"}`}>
                  {config.label}
                </p>
              </div>

              {/* Step number */}
              <span className={`text-[10px] font-mono flex-shrink-0 transition-colors ${isActive ? "text-[#D4AF6E]/80" : "text-white/20 group-hover:text-white/40"}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
            </motion.button>
            
            {/* Hover Tooltip Preview */}
            <AnimatePresence>
              {isHovered && !isActive && (
                <motion.div
                  initial={{ opacity: 0, x: 10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 5, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-48 p-3 rounded-xl bg-black/90 border border-white/10 shadow-2xl backdrop-blur-md z-50 pointer-events-none"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                    <span className="text-[10px] uppercase font-bold text-white/50">{config.label}</span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">{step.title || config.label}</p>
                  
                  {/* Subtle triangle pointer */}
                  <div className="absolute top-1/2 -translate-y-1/2 -left-[5px] w-2 h-2 bg-black/90 border-l border-b border-white/10 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
};
