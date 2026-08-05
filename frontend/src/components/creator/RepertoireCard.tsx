/**
 * RepertoireCard.tsx
 *
 * Pinned Signature Opening Repertoire Card (Spotify Artist Pick style).
 * Features an embedded playable mini-chessboard (<ThemedChessboard>)
 * that allows creators and students to step through variations inline.
 */

import { useState } from "react";
import { ChevronRight, ChevronLeft, RotateCcw, Bookmark, Sparkles } from "lucide-react";
import { ThemedChessboard } from "../ThemedChessboard";
import { BoardCoordinates } from "../BoardCoordinates";
import { soundManager } from "../../utils/SoundManager";
import type { RepertoireItem } from "../../data/creatorMockData";

interface RepertoireCardProps {
  repertoire: RepertoireItem;
  isPinned?: boolean;
}

export function RepertoireCard({ repertoire, isPinned = true }: RepertoireCardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Cycle through FENs safely
  const fens = repertoire.fens;
  const currentFen = fens[currentStepIndex % fens.length];

  const handleNext = () => {
    soundManager.playButtonClick();
    setCurrentStepIndex((prev) => (prev + 1) % fens.length);
  };

  const handlePrev = () => {
    soundManager.playButtonClick();
    setCurrentStepIndex((prev) => (prev - 1 + fens.length) % fens.length);
  };

  const handleReset = () => {
    soundManager.playButtonClick();
    setCurrentStepIndex(0);
  };

  return (
    <div className="relative w-full rounded-3xl border border-brand-accent/25 bg-obsidian-mid p-6 shadow-xl transition-all duration-300 hover:border-brand-accent/50 group">
      {/* Pinned Creator Pick Header */}
      {isPinned && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-brand-text/10">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-brand-accent uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Creator Pick • Signature Line</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-brand-accent/10 border border-brand-accent/30 text-brand-accent">
            ECO {repertoire.eco}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Interactive Mini Chessboard Container (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-2xl overflow-hidden border-2 border-brand-accent/40 shadow-2xl bg-obsidian">
            <ThemedChessboard
              options={{
                position: currentFen,
                boardOrientation: repertoire.side,
                showNotation: false,
                allowDragging: false,
                boardStyle: { borderRadius: "0px" },
              }}
            />
            <BoardCoordinates boardOrientation={repertoire.side} />

            {/* Stepper Overlay Pill */}
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-obsidian/90 border border-brand-accent/30 text-[10px] font-mono text-brand-accent backdrop-blur-md">
              Position {currentStepIndex + 1} / {fens.length}
            </div>
          </div>

          {/* Inline Move Stepper Controls */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-brand-text/5 hover:bg-brand-text/10 text-brand-secondary hover:text-brand-text border border-brand-text/10 transition-colors cursor-pointer"
              title="Reset position"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-brand-text/5 hover:bg-brand-text/10 text-brand-secondary hover:text-brand-text border border-brand-text/10 transition-colors cursor-pointer"
              title="Previous move"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="px-3 py-2 rounded-xl bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent border border-brand-accent/30 text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1"
              title="Next move"
            >
              <span>Next Move</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Repertoire Commentary & Moves Tree (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-brand-text tracking-wide">
              {repertoire.title}
            </h3>
            <p className="text-xs sm:text-sm font-sans text-brand-secondary mt-1 leading-relaxed">
              {repertoire.description}
            </p>
          </div>

          {/* Moves Sequence Pills */}
          <div className="p-3 rounded-2xl bg-obsidian-glass border border-brand-text/10 flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-mono text-brand-secondary mr-1">Main Line:</span>
            {repertoire.moves.map((mv, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                  mv.includes("!")
                    ? "bg-brand-accent/20 text-brand-accent font-bold border border-brand-accent/40"
                    : "bg-brand-text/5 text-brand-text/90"
                }`}
              >
                {mv}
              </span>
            ))}
          </div>

          {/* Highlight Key Move Note */}
          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-brand-accent/30 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-brand-accent/20 text-brand-accent shrink-0 mt-0.5">
              <Bookmark className="w-4 h-4" />
            </div>
            <div className="flex flex-col space-y-0.5">
              <span className="text-xs font-mono font-bold text-brand-accent">
                Key Repertoire Secret ({repertoire.highlightMove})
              </span>
              <p className="text-xs font-sans text-brand-text/80 leading-relaxed">
                {repertoire.highlightNote}
              </p>
            </div>
          </div>

          {/* Enrollment Stats */}
          <div className="flex items-center justify-between pt-2 text-xs font-sans text-brand-secondary border-t border-brand-text/10">
            <span>Enrolled Students: <strong className="text-brand-text font-mono">{repertoire.enrolledStudents.toLocaleString()}</strong></span>
            <span>Mastery Rate: <strong className="text-brand-accent font-mono">{repertoire.masteryRate}%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
