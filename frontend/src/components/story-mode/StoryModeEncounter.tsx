/**
 * StoryModeEncounter.tsx
 *
 * Random encounter screen shown when the player lands on a mystery (?) node.
 * Displays a random event with flavour text from the hardcoded encounters list.
 * This is a placeholder — future versions will have interactive mini-games.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, RotateCcw } from "lucide-react";
import { RANDOM_ENCOUNTERS } from "../../data/storyModeMapData";

interface StoryModeEncounterProps {
  nodeLabel: string;
  onComplete: () => void;
  onRetreat: () => void;
}

export default function StoryModeEncounter({
  nodeLabel,
  onComplete,
  onRetreat,
}: StoryModeEncounterProps) {
  const [revealed, setRevealed] = useState(false);

  // Pick a random encounter on mount
  const encounter = useMemo(() => {
    const idx = Math.floor(Math.random() * RANDOM_ENCOUNTERS.length);
    return RANDOM_ENCOUNTERS[idx];
  }, []);

  return (
    <motion.div
      className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Ambient glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[700px] h-[400px] bg-gradient-to-r from-purple-500/8 via-violet-500/5 to-transparent rounded-full blur-[120px] pointer-events-none z-0" />

      <motion.div
        className="relative z-10 max-w-lg w-full flex flex-col items-center gap-6 py-8 px-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 backdrop-blur-sm"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        {/* Location tag */}
        <span className="text-xs font-mono text-purple-400/70 tracking-widest uppercase">
          {nodeLabel}
        </span>

        {/* Mystery icon */}
        <motion.div
          className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center"
          animate={{
            boxShadow: [
              "0 0 20px rgba(168,85,247,0.2)",
              "0 0 40px rgba(168,85,247,0.4)",
              "0 0 20px rgba(168,85,247,0.2)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {!revealed ? (
            <span className="text-4xl font-display font-bold text-purple-400">
              ?
            </span>
          ) : (
            <Sparkles className="w-8 h-8 text-purple-400" />
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.div
              key="unrevealed"
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 className="text-xl font-display font-bold text-brand-text">
                A Mystery Awaits…
              </h2>
              <p className="text-sm text-brand-secondary text-center leading-relaxed">
                Something stirs in the shadows. Do you dare to look closer?
              </p>
              <div className="flex gap-3 mt-2 flex-wrap justify-center">
                <button
                  onClick={onRetreat}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border/60 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 transition-all duration-200 text-sm font-medium cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retreat
                </button>
                <button
                  onClick={() => setRevealed(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 hover:border-purple-500/60 transition-all duration-200 text-sm font-medium cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Investigate
                </button>
              </div>
              
              {/* DEV Only: Skip Button */}
              {import.meta.env.VITE_ENABLE_STORY_DEV_TOOLS === 'true' && (
                <div className="mt-4 p-2 rounded border border-dashed border-yellow-500/50 bg-yellow-500/10 flex justify-center opacity-80 hover:opacity-100 transition-opacity w-full">
                  <span className="text-[10px] text-yellow-500 font-mono self-center mr-2">DEV:</span>
                  <button onClick={onComplete} className="px-2 py-1 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-[10px] font-mono hover:bg-green-500/40 cursor-pointer">Skip Encounter</button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-xl font-display font-bold text-purple-300">
                {encounter.title}
              </h2>
              <p className="text-sm text-brand-secondary text-center leading-relaxed max-w-sm">
                {encounter.text}
              </p>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-mono text-purple-400">
                  {encounter.effect}
                </span>
              </div>
              <button
                onClick={onComplete}
                className="flex items-center gap-2 px-6 py-3 mt-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 hover:border-purple-500/60 transition-all duration-200 text-sm font-medium cursor-pointer"
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
