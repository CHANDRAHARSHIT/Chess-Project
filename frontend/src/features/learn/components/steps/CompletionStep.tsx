import React, { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useLessonContext } from "../../context/LessonContext";
import { useNavigate } from "react-router";
import { Trophy, Clock, Target, Star, Zap, ChevronRight, RotateCcw, Award } from "lucide-react";

// Confetti particle (pure CSS-driven)
const Particle: React.FC<{ delay: number; color: string; left: number }> = ({ delay, color, left }) => (
  <motion.div
    initial={{ opacity: 0, y: 0, x: 0, rotate: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 1, 0],
      y: [-20, -180 - Math.random() * 120],
      x: (Math.random() - 0.5) * 200,
      rotate: Math.random() * 720 - 360,
      scale: [0, 1.2, 1, 0.5],
    }}
    transition={{ duration: 1.8, delay, ease: "easeOut" }}
    style={{ left: `${left}%`, backgroundColor: color }}
    className="absolute bottom-0 w-2.5 h-2.5 rounded-sm pointer-events-none z-0"
  />
);

const CONFETTI_COLORS = ["#D4AF6E", "#B8934A", "#F5F0E8", "#5B9BD5", "#52C41A", "#F5A623"];

const AnimatedCounter: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = "" }) => {
  const safeVal = isNaN(value) ? 0 : value;
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 80, damping: 18 });
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionVal.set(safeVal);
  }, [safeVal]);

  useEffect(() => {
    return spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = `${Math.round(v)}${suffix}`;
    });
  }, [spring, suffix]);

  return <span ref={ref}>0{suffix}</span>;
};

export const CompletionStep: React.FC<{ step: any }> = () => {
  const { lesson, engineState } = useLessonContext();
  const { totalSteps, stats } = engineState;
  const { timeSpent = 0, mistakes = 0, xpEarned = 50 } = stats || {};
  const navigate = useNavigate();

  const formatTime = (s: number) => {
    const safeS = isNaN(s) ? 0 : s;
    return `${Math.floor(safeS / 60)}:${(safeS % 60).toString().padStart(2, "0")}`;
  };

  const stepsCount = totalSteps || 1;
  const accuracy = Math.max(0, Math.min(100, Math.round(((stepsCount - mistakes) / stepsCount) * 100)));
  const stars = accuracy === 100 ? 3 : accuracy >= 70 ? 2 : 1;
  const isPerfect = mistakes === 0;

  // Build 40 confetti particles
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.8,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: Math.random() * 100,
  }));

  const masteredItems = lesson?.settings?.objectives || [
    "Opening Principles & Center Control",
    "Piece Development & Mobility",
    "Tactical Defense & Move Calculation"
  ];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[65vh] overflow-hidden px-4 py-8">
      {/* Confetti burst */}
      {particles.map(p => <Particle key={p.id} {...p} />)}

      {/* Radial glow behind trophy */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_40%,rgba(212,175,110,0.18),transparent)] pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-7 max-w-md w-full"
      >
        {/* Trophy & Badge Reveal */}
        <div className="relative flex items-center justify-center h-28">
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 bg-[#D4AF6E]/20 blur-3xl rounded-full"
          />
          
          <motion.div
            initial={{ y: 20, rotateY: -180 }}
            animate={{ y: [0, -6, 0], rotateY: 0 }}
            transition={{ y: { repeat: Infinity, duration: 3, ease: "easeInOut" }, rotateY: { duration: 1, ease: [0.16, 1, 0.3, 1] } }}
            className="relative z-10"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF6E]/30 to-[#D4AF6E]/10 border-2 border-[#D4AF6E]/50 flex items-center justify-center shadow-[0_0_80px_rgba(212,175,110,0.4)] overflow-hidden">
              <div className="absolute inset-1.5 rounded-full border border-[#D4AF6E]/30" />
              <Award className="w-12 h-12 text-[#D4AF6E] drop-shadow-lg" />
            </div>
            
            {isPerfect && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 400 }}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-400 text-black text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-[0_4px_15px_rgba(52,211,153,0.4)] whitespace-nowrap border border-emerald-300"
              >
                Perfect Mastery
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-3">
          {[1, 2, 3].map(star => (
            <motion.div
              key={star}
              initial={{ opacity: 0, scale: 0, rotate: -30, y: 10 }}
              animate={{ opacity: star <= stars ? 1 : 0.2, scale: 1, rotate: 0, y: 0 }}
              transition={{ delay: 0.3 + star * 0.1, type: "spring", stiffness: 350 }}
            >
              <Star
                className={`w-9 h-9 ${star <= stars ? "text-[#D4AF6E] fill-[#D4AF6E] drop-shadow-[0_0_15px_rgba(212,175,110,0.6)]" : "text-white/15"}`}
              />
            </motion.div>
          ))}
        </div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">Lesson Completed!</h2>
          <p className="text-[#D4AF6E] text-sm font-medium">You have mastered "{lesson?.title || 'this lesson'}"</p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-3 w-full"
        >
          {[
            {
              icon: <Target className="w-5 h-5" />,
              label: "Accuracy",
              value: accuracy,
              suffix: "%",
              color: accuracy >= 80 ? "text-emerald-400" : "text-[#D4AF6E]",
              bg: accuracy >= 80 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-[#D4AF6E]/10 border-[#D4AF6E]/30",
            },
            {
              icon: <Zap className="w-5 h-5 text-[#D4AF6E]" />,
              label: "XP Gained",
              value: xpEarned || Math.round(50 * (accuracy / 100)),
              prefix: "+",
              color: "text-[#D4AF6E]",
              bg: "bg-[#D4AF6E]/10 border-[#D4AF6E]/30 shadow-[0_0_20px_rgba(212,175,110,0.15)]",
            },
            {
              icon: <Clock className="w-5 h-5 text-blue-400" />,
              label: "Time",
              formattedValue: formatTime(timeSpent),
              color: "text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/30",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 + i * 0.08 }}
              className={`flex flex-col items-center p-3.5 rounded-2xl border backdrop-blur-md ${stat.bg}`}
            >
              <span className={stat.color}>{stat.icon}</span>
              <span className={`text-2xl font-bold mt-1.5 ${stat.color}`}>
                {stat.formattedValue ? stat.formattedValue : (
                  <>
                    {(stat as any).prefix || ""}
                    <AnimatedCounter value={stat.value!} suffix={(stat as any).suffix || ""} />
                  </>
                )}
              </span>
              <span className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5 font-bold">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* What you mastered */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="w-full p-4 rounded-2xl bg-white/[0.03] border border-[#D4AF6E]/20"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF6E] mb-3">Key Masteries</p>
          <div className="flex flex-col gap-2.5">
            {masteredItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-white/80">
                <div className="w-4 h-4 rounded-full bg-[#D4AF6E]/20 border border-[#D4AF6E]/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] text-[#D4AF6E]">✓</span>
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-3 w-full"
        >
          <button
            onClick={() => navigate("/learn")}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-sm font-semibold transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            All Courses
          </button>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(212,175,110,0.3)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/learn")}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#D4AF6E] hover:bg-[#B8934A] text-[#080B14] font-bold text-sm shadow-[0_0_20px_rgba(212,175,110,0.2)] transition-all"
          >
            Continue Learning
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};
