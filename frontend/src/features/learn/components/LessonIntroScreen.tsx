import React from "react";
import { motion } from "framer-motion";
import { useLessonContext } from "../context/LessonContext";
import { ThemedChessboard } from "../../../components/ThemedChessboard";
import {
  Clock, Zap, BookOpen, ChevronRight, ArrowRight,
  Target, Swords, HelpCircle, Trophy
} from "lucide-react";

const difficultyColor: Record<string, string> = {
  Beginner: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Intermediate: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Advanced: "text-red-400 bg-red-400/10 border-red-400/20",
};

const categoryGradient: Record<string, string> = {
  Openings: "from-[#D4AF6E]/20 via-[#B8934A]/10 to-transparent",
  Tactics: "from-red-500/20 via-red-900/10 to-transparent",
  Endgames: "from-blue-500/20 via-blue-900/10 to-transparent",
  default: "from-purple-500/20 via-purple-900/10 to-transparent",
};

const stepTypeIcons: Record<string, React.ReactNode> = {
  TEXT: <BookOpen className="w-3.5 h-3.5" />,
  BOARD: <Swords className="w-3.5 h-3.5" />,
  QUIZ: <HelpCircle className="w-3.5 h-3.5" />,
  CALLOUT: <Zap className="w-3.5 h-3.5" />,
  COMPLETION: <Trophy className="w-3.5 h-3.5" />,
};

const objectives: string[] = [
  "Understand the importance of center control",
  "Learn to play the e4 opening move",
  "Apply your knowledge in a live quiz",
];

export const LessonIntroScreen: React.FC = () => {
  const { lesson, startLesson, engineState } = useLessonContext();
  const totalSteps = engineState.totalSteps;
  if (!lesson) return null;

  const steps = lesson.content?.steps || [];
  // Find first board step FEN for mini preview
  const boardStep = steps.find(s => s.type === "BOARD");
  const previewFen = boardStep?.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const gradient = categoryGradient[lesson.category] || categoryGradient.default;
  const diffClass = difficultyColor[lesson.difficulty] || "text-white/50 bg-white/5 border-white/10";

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-[#080B14] flex items-start justify-center overflow-y-auto">
      {/* Ambient glow & noise */}
      <div className={`fixed inset-0 bg-gradient-to-b ${gradient} pointer-events-none`} />
      <div className="fixed inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF6E]/20 to-transparent" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
      >
        {/* LEFT — Meta & CTA */}
        <div className="flex flex-col gap-6">
          {/* Category badge */}
          <motion.div variants={item}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF6E]/10 border border-[#D4AF6E]/25 text-[#D4AF6E] text-xs font-semibold tracking-wider uppercase">
              <Swords className="w-3.5 h-3.5" />
              {lesson.category}
            </span>
          </motion.div>

          {/* Title */}
          <motion.div variants={item}>
            <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]">
              {lesson.title}
            </h1>
          </motion.div>

          {/* Description */}
          <motion.p variants={item} className="text-base text-white/50 leading-relaxed">
            {lesson.description}
          </motion.p>

          {/* Meta pills */}
          <motion.div variants={item} className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-xs text-white/50">
              <Clock className="w-3.5 h-3.5" />
              {lesson.estimatedTime} min
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF6E]/5 border border-[#D4AF6E]/20 text-xs text-[#D4AF6E]/80 font-semibold">
              <Zap className="w-3.5 h-3.5" />
              50 XP
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${diffClass}`}>
              <Target className="w-3.5 h-3.5" />
              {lesson.difficulty}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-xs text-white/50">
              <BookOpen className="w-3.5 h-3.5" />
              {totalSteps} steps
            </div>
          </motion.div>

          {/* Objectives */}
          <motion.div variants={item} className="flex flex-col gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">
              What you'll learn
            </p>
            <div className="flex flex-col gap-2.5">
              {objectives.map((obj, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-[#D4AF6E]/10 border border-[#D4AF6E]/25 flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] text-[#D4AF6E] font-bold">{i + 1}</span>
                  </div>
                  <span className="text-sm text-white/60 leading-snug">{obj}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Step type preview dots */}
          <motion.div variants={item} className="flex items-center gap-2">
            <span className="text-[10px] text-white/25 uppercase tracking-wider">Steps:</span>
            <div className="flex items-center gap-1.5">
              {steps.map((step, i) => (
                <div
                  key={step.id}
                  title={step.type}
                  className={`w-6 h-6 rounded-md flex items-center justify-center ${
                    step.type === "COMPLETION" ? "bg-emerald-500/15 text-emerald-400" :
                    step.type === "BOARD" ? "bg-[#D4AF6E]/15 text-[#D4AF6E]" :
                    step.type === "QUIZ" ? "bg-purple-500/15 text-purple-400" :
                    "bg-white/5 text-white/30"
                  }`}
                >
                  <span className="text-[10px]">{stepTypeIcons[step.type]}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div variants={item} className="pt-2">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(212,175,110,0.25)" }}
              whileTap={{ scale: 0.97 }}
              onClick={startLesson}
              className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-[#D4AF6E] text-[#080B14] font-bold text-base tracking-tight overflow-hidden transition-all"
            >
              <span className="relative z-10">Start Learning</span>
              <ChevronRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              {/* shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
            </motion.button>
          </motion.div>
        </div>

        {/* RIGHT — Board preview */}
        <motion.div
          variants={item}
          className="relative flex flex-col gap-6"
        >
          <div className="relative">
            {/* Decorative glow behind board */}
            <div className="absolute inset-[-20px] bg-[#D4AF6E]/8 rounded-3xl blur-3xl pointer-events-none" />
            <div className="relative rounded-2xl overflow-hidden border border-[#D4AF6E]/15 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
              {/* Frosted overlay so board looks "preview-mode" */}
              <div className="absolute inset-0 z-10 bg-[#080B14]/30 backdrop-blur-[2px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#D4AF6E]/10 border border-[#D4AF6E]/30 flex items-center justify-center">
                    <Swords className="w-7 h-7 text-[#D4AF6E]" />
                  </div>
                  <p className="text-sm text-[#D4AF6E]/80 font-medium">Board Preview</p>
                </div>
              </div>
              <ThemedChessboard
                options={{
                  position: previewFen,
                  arePiecesDraggable: false,
                  showNotation: false,
                }}
              />
            </div>
          </div>

          {/* Bottom stats bar */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "XP Reward", value: "50 XP", accent: true },
              { label: "Steps", value: `${totalSteps}` },
              { label: "Difficulty", value: lesson.difficulty || "Beginner" },
            ].map(stat => (
              <div key={stat.label} className={`flex flex-col items-center p-3 rounded-xl border ${
                stat.accent ? "bg-[#D4AF6E]/5 border-[#D4AF6E]/20" : "bg-white/[0.02] border-white/5"
              }`}>
                <span className={`text-lg font-bold ${stat.accent ? "text-[#D4AF6E]" : "text-white"}`}>
                  {stat.value}
                </span>
                <span className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
