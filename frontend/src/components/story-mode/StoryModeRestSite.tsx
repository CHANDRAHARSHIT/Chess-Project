/**
 * StoryModeRestSite.tsx
 *
 * Fireplace / rest site screen shown when the player lands on a campfire node.
 * This is a "Coming Soon" placeholder with an animated campfire visual.
 * Future versions will have healing, upgrade, and strategy review mechanics.
 */

import { motion } from "framer-motion";
import { Flame, Clock, ArrowRight, RotateCcw } from "lucide-react";

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
  return (
    <motion.div
      className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Warm ambient glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[700px] h-[400px] bg-gradient-to-t from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-[120px] pointer-events-none z-0" />

      <motion.div
        className="relative z-10 max-w-lg w-full flex flex-col items-center gap-6 py-8 px-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 backdrop-blur-sm"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        {/* Location tag */}
        <span className="text-xs font-mono text-orange-400/70 tracking-widest uppercase">
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

          {/* Floating embers */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-orange-400/60"
              style={{
                left: `${40 + Math.random() * 20}%`,
                bottom: "60%",
              }}
              animate={{
                y: [0, -40 - Math.random() * 30],
                x: [0, (Math.random() - 0.5) * 20],
                opacity: [0.8, 0],
                scale: [1, 0.3],
              }}
              transition={{
                duration: 1.5 + Math.random(),
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-display font-bold text-brand-text">
          Rest Site
        </h2>

        {/* Description */}
        <p className="text-sm text-brand-secondary text-center leading-relaxed max-w-sm">
          {nodeDescription}
        </p>

        {/* Coming Soon badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/5"
        >
          <Clock className="w-3 h-3 text-orange-400" />
          <span className="text-xs font-mono text-orange-400 uppercase tracking-widest font-semibold">
            Coming Soon
          </span>
        </motion.div>

        <p className="text-xs text-brand-secondary/60 text-center max-w-xs">
          Healing, strategy review, and upgrade mechanics will be added in a
          future update.
        </p>

        {/* Divider */}
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRetreat}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border/60 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 transition-all duration-200 text-sm font-medium cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Back to Map
          </button>
          <button
            onClick={onComplete}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30 hover:border-orange-500/60 transition-all duration-200 text-sm font-medium cursor-pointer"
          >
            Rest & Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
