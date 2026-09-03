/**
 * StoryModePage.tsx
 *
 * Page wrapper for the Story Mode adventure map feature.
 * Renders the page title/description and the StoryModeMap component.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Swords, ArrowLeft } from "lucide-react";
import StoryModeMap from "@/components/storymode-StoryModeMap";
import {
  StoryModeProvider,
  useStoryModeRun,
} from "@/contexts/storymode-StoryModeContext";
import { OdysseyTitleScreen } from "@/components/storymode-OdysseyTitleScreen";
import { StrategistPage } from "@/components/storymode-StrategistPage";
import { useState, useEffect, useRef } from "react";

function StoryModeContent() {
  const [viewState, setViewState] = useState<"title" | "strategist" | "map">(
    "title",
  );
  const { runState, updateRunState } = useStoryModeRun();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hasActiveRun =
    runState.currentNodeId !== -1 || runState.completedNodes.length > 0;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const enterFullscreen = async () => {
    if (
      pageContainerRef.current &&
      pageContainerRef.current.requestFullscreen
    ) {
      try {
        await pageContainerRef.current.requestFullscreen();
      } catch (err) {
        console.error("Error attempting to enable fullscreen:", err);
      }
    }
  };

  // Playtime Tracker
  useEffect(() => {
    if (viewState !== "map") return; // Only track time when actively in the map/game

    const interval = setInterval(() => {
      updateRunState((prev) => ({
        playtimeSeconds: (prev.playtimeSeconds || 0) + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [viewState, updateRunState]);

  return (
    <div
      ref={pageContainerRef}
      className={`h-screen w-screen text-brand-text flex flex-col items-center justify-center bg-brand-bg overflow-hidden transition-all duration-[1200ms] ${
        isFullscreen ? "p-0" : "p-1 sm:p-2 md:p-3"
      }`}
    >
      {/* Game Screen Outer Rectangle */}
      <motion.div
        layout
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className={`overflow-hidden relative flex flex-col bg-brand-surface ${
          isFullscreen
            ? "w-full h-full border-transparent rounded-none max-w-none"
            : "w-[90vw] max-w-[1400px] h-[95vh] border border-[#D4AF6E]/60 rounded-3xl"
        }`}
      >
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
              <OdysseyTitleScreen
                onStartSingleplayer={() => {
                  enterFullscreen();
                  if (hasActiveRun) {
                    setViewState("map");
                  } else {
                    setViewState("strategist");
                  }
                }}
              />
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
              className="absolute inset-0 flex flex-col w-full h-full z-10"
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

              <main className="flex-1 w-full max-w-[1600px] mx-auto px-2.5 sm:px-6 pt-14 pb-4 sm:pt-12 sm:pb-6 flex flex-col relative z-10 min-h-0 overflow-hidden">
                {/* Header */}
                <div className="flex flex-col items-center gap-2 mb-2 text-center shrink-0">
                  {/* Icon */}
                  <motion.div
                    className="w-12 h-12 rounded-full bg-brand-accent/8 border border-brand-accent/20 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                    animate={{ y: [0, -5, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Swords className="w-6 h-6 text-brand-accent" />
                  </motion.div>

                  <div>
                    <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight bg-gradient-to-br from-brand-text to-brand-text/70 bg-clip-text text-transparent">
                      Odyssey
                    </h1>
                  </div>

                  {/* Decorative divider */}
                  <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#D4AF6E]/40 to-transparent" />
                </div>

                {/* Map */}
                <div className="flex-1 flex flex-col w-full relative min-h-0">
                  <StoryModeMap onResetToTitle={() => setViewState("title")} />
                </div>
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
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
