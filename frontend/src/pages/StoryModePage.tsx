/**
 * StoryModePage.tsx
 *
 * Page wrapper for the Story Mode adventure map feature.
 * Renders the page title/description and the StoryModeMap component.
 */

import { motion } from "framer-motion";
import { Swords, ArrowLeft } from "lucide-react";
import StoryModeMap from "@/features/story-mode/StoryModeMap";
import { useNavigate } from "react-router";

export default function StoryModePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-brand-text flex flex-col relative">
      {/* Back button */}
      <div className="absolute top-6 left-4 sm:left-8 z-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-all text-sm font-mono cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-10">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
          {/* Icon */}
          <motion.div
            className="w-14 h-14 rounded-full bg-brand-accent/8 border border-brand-accent/20 flex items-center justify-center"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Swords className="w-7 h-7 text-brand-accent" />
          </motion.div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">
              Odyssey
            </h1>
            <p className="text-sm text-brand-secondary mt-2 max-w-md leading-relaxed">
              Embark on a chess adventure! Battle AI opponents, uncover
              mysteries, and conquer the Dark King. Each victory unlocks the
              path forward.
            </p>
          </div>

          {/* Decorative divider */}
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-brand-accent/30 to-transparent" />
        </div>

        {/* Map */}
        <StoryModeMap />
      </main>
    </div>
  );
}
