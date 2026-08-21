/**
 * StoryModePage.tsx
 *
 * Page wrapper for the Story Mode adventure map feature.
 * Renders the page title/description and the StoryModeMap component.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Swords, ArrowLeft } from "lucide-react";
import StoryModeMap from "@/features/story-mode/StoryModeMap";
import { StoryModeProvider, useStoryModeRun } from "@/features/story-mode/StoryModeContext";
import { OdysseyTitleScreen } from "@/features/story-mode/TitleScreen/OdysseyTitleScreen";
import { StrategistPage } from "@/features/story-mode/TitleScreen/StrategistPage";
import { useState, useEffect } from "react";

function StoryModeContent() {
  const [viewState, setViewState] = useState<"title" | "strategist" | "map">("title");
  const { runState, updateRunState } = useStoryModeRun();

  const hasActiveRun = runState.currentNodeId !== -1 || runState.completedNodes.length > 0;

  // Playtime Tracker
  useEffect(() => {
    if (viewState !== "map") return; // Only track time when actively in the map/game

    const interval = setInterval(() => {
      updateRunState(prev => ({ playtimeSeconds: (prev.playtimeSeconds || 0) + 1 }));
    }, 1000);

    return () => clearInterval(interval);
  }, [viewState, updateRunState]);

  return (
    <div className="min-h-screen text-brand-text flex flex-col items-center justify-center p-2 sm:p-6 md:p-8 bg-brand-bg">
      {/* Game Screen Outer Rectangle */}
      <div className="w-full max-w-[1400px] border border-[#D4AF6E]/60 rounded-3xl overflow-hidden relative flex flex-col min-h-[90vh] bg-brand-surface">
        
        <AnimatePresence mode="wait">
          {viewState === "title" && (
            <motion.div
              key="title-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 z-30 flex flex-col"
            >
              <OdysseyTitleScreen onStartSingleplayer={() => {
                if (hasActiveRun) {
                  setViewState("map");
                } else {
                  setViewState("strategist");
                }
              }} />
            </motion.div>
          )}

          {viewState === "strategist" && (
            <motion.div
              key="strategist-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 z-30 flex flex-col"
            >
              <StrategistPage
                onBack={() => setViewState("title")}
                onConfirm={() => setViewState("map")}
              />
            </motion.div>
          )}

          {viewState === "map" && (
            <motion.div
              key="game-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
              className="flex-1 flex flex-col relative w-full h-full z-10"
            >
              {/* Back button */}
              <div className="absolute top-6 left-4 sm:left-8 z-20">
                <button
                  onClick={() => setViewState("title")}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-brand-secondary hover:text-brand-text hover:bg-brand-surface/50 border border-transparent hover:border-brand-border/40 transition-all text-sm font-mono cursor-pointer backdrop-blur-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Title
                </button>
              </div>

              <main className="flex-1 w-full max-w-5xl mx-auto px-2.5 sm:px-6 pt-16 pb-8 sm:py-12 flex flex-col relative z-10">
                {/* Header */}
                <div className="flex flex-col items-center gap-4 mb-8 text-center shrink-0">
                  {/* Icon */}
                  <motion.div
                    className="w-14 h-14 rounded-full bg-brand-accent/8 border border-brand-accent/20 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Swords className="w-7 h-7 text-brand-accent" />
                  </motion.div>

                  <div>
                    <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight bg-gradient-to-br from-brand-text to-brand-text/70 bg-clip-text text-transparent">
                      Odyssey
                    </h1>
                    <p className="text-sm text-brand-secondary mt-2 max-w-md leading-relaxed">
                      Embark on a chess adventure! Battle AI opponents, uncover mysteries, and conquer the Dark King. Each victory unlocks the path forward.
                    </p>
                  </div>

                  {/* Decorative divider */}
                  <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#D4AF6E]/40 to-transparent my-2" />
                </div>

                {/* Map */}
                <div className="flex-1 flex flex-col w-full relative">
                  <StoryModeMap onResetToTitle={() => setViewState("title")} />
                </div>
              </main>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default function StoryModePage() {
  return (
    <StoryModeProvider>
      <StoryModeContent />
    </StoryModeProvider>
  );
}
