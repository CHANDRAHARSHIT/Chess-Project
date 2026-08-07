/**
 * StoryModeRestSite.tsx
 *
 * Fireplace / rest site screen shown when the player lands on a campfire node.
 * Features an interactive resting sequence with healing animations before continuing.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, ArrowRight, RotateCcw, Heart, Sparkles } from "lucide-react";

interface StoryModeRestSiteProps {
  nodeLabel: string;
  nodeDescription: string;
  onComplete: () => void;
  onRetreat: () => void;
}

export default function StoryModeRestSite({
  nodeLabel,
  nodeDescription,
  onComplete,
  onRetreat,
}: StoryModeRestSiteProps) {
  const [isResting, setIsResting] = useState(false);
  const [hasRested, setHasRested] = useState(false);

  const handleRest = () => {
    setIsResting(true);
    // Simulate rest sequence duration
    setTimeout(() => {
      setIsResting(false);
      setHasRested(true);
    }, 2000);
  };

  return (
    <motion.div
      className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Warm ambient glow */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[700px] h-[400px] bg-gradient-to-t from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-[120px] pointer-events-none z-0"
        style={{
          opacity: isResting ? 0.8 : hasRested ? 0.4 : 0.6,
          transition: "opacity 2s ease",
        }}
      />

      <motion.div
        className="relative z-10 max-w-lg w-full flex flex-col items-center gap-6 py-8 px-4 sm:px-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 backdrop-blur-sm mx-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        {/* Location tag */}
        <span className="text-xs font-mono text-orange-400/70 tracking-widest uppercase text-center">
          {nodeLabel}
        </span>

        {/* Campfire icon with flicker animation */}
        <div className="relative">
          <motion.div
            className="w-20 h-20 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center"
            animate={{
              boxShadow: [
                "0 0 20px rgba(251,146,60,0.2)",
                "0 0 50px rgba(251,146,60,0.4)",
                "0 0 30px rgba(251,146,60,0.3)",
                "0 0 20px rgba(251,146,60,0.2)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 0.95, 1.05, 1],
                rotate: [0, -3, 3, -2, 0],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Flame className="w-9 h-9 text-orange-400" />
            </motion.div>
          </motion.div>

          {/* Floating embers / healing particles */}
          {[...Array(isResting ? 12 : 4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: `${30 + Math.random() * 40}%`,
                bottom: "50%",
                backgroundColor: isResting ? "#4ade80" : "#fb923c",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                y: [0, -60 - Math.random() * 60],
                x: [0, (Math.random() - 0.5) * 40],
                opacity: [0.8, 0],
                scale: [1, 0.2],
              }}
              transition={{
                duration: isResting ? 1 + Math.random() : 1.5 + Math.random(),
                repeat: Infinity,
                delay: i * (isResting ? 0.1 : 0.4),
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!hasRested ? (
            <motion.div
              key="resting-state"
              className="flex flex-col items-center gap-4 w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 className="text-2xl font-display font-bold text-brand-text">
                Rest Site
              </h2>
              <p className="text-sm text-brand-secondary text-center leading-relaxed max-w-sm px-2">
                {isResting
                  ? "You rest by the fire, letting the warmth heal your weary spirit…"
                  : nodeDescription}
              </p>

              {/* Divider */}
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent my-2" />

              {/* Actions */}
              <div className="flex gap-3 flex-wrap justify-center w-full">
                <button
                  onClick={onRetreat}
                  disabled={isResting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border/60 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 transition-all duration-200 text-sm font-medium cursor-pointer disabled:opacity-30"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retreat
                </button>
                <button
                  onClick={handleRest}
                  disabled={isResting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30 hover:border-orange-500/60 transition-all duration-200 text-sm font-medium cursor-pointer disabled:opacity-30 disabled:scale-95"
                >
                  <Heart className={`w-4 h-4 ${isResting ? "animate-pulse" : ""}`} />
                  {isResting ? "Resting…" : "Rest"}
                </button>
              </div>
              
              {/* DEV Only: Skip Button */}
              {import.meta.env.VITE_ENABLE_STORY_DEV_TOOLS === 'true' && (
                <div className="mt-4 p-2 rounded border border-dashed border-yellow-500/50 bg-yellow-500/10 flex justify-center opacity-80 hover:opacity-100 transition-opacity w-full">
                  <span className="text-[10px] text-yellow-500 font-mono self-center mr-2">DEV:</span>
                  <button onClick={onComplete} className="px-2 py-1 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-[10px] font-mono hover:bg-green-500/40 cursor-pointer">Skip Rest</button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="rested-state"
              className="flex flex-col items-center gap-4 w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-display font-bold text-green-400 flex items-center gap-2">
                <Sparkles className="w-6 h-6" /> Rested
              </h2>
              <p className="text-sm text-brand-secondary text-center leading-relaxed max-w-sm px-2">
                Your focus is renewed. You are ready to face the challenges ahead.
              </p>

              {/* Divider */}
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent my-2" />

              <button
                onClick={onComplete}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30 hover:border-green-500/60 transition-all duration-200 text-sm font-medium cursor-pointer"
              >
                Continue Journey
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
