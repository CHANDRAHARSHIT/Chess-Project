/**
 * RepertoireCard.tsx
 *
 * Pinned Signature Repertoire card featuring Alex Vance's Catalan Gold Repertoire.
 * Features an embedded interactive playable mini-chessboard with move stepper controls.
 * Fully theme-aware for light and dark modes.
 */

import { useState } from "react";
import { ChevronRight, ChevronLeft, RotateCcw, Pin, Star } from "lucide-react";
import { ThemedChessboard } from "../ThemedChessboard";
import { BoardCoordinates } from "../BoardCoordinates";
import { soundManager } from "../../utils/SoundManager";
import type { RepertoireItem } from "../../data/creatorMockData";

interface RepertoireCardProps {
  repertoire: RepertoireItem;
  isPinned?: boolean;
}

export function RepertoireCard({ repertoire, isPinned = true }: RepertoireCardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(repertoire.fens.length - 1);

  const handleStep = (newIndex: number) => {
    soundManager.playButtonClick();
    setCurrentStepIndex(newIndex);
  };

  return (
    <div className="relative w-full rounded-3xl border border-brand-accent/40 bg-brand-surface p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Top Banner: Pinned Badge & ECO Code */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-brand-text/10">
        <div className="flex items-center gap-3">
          {isPinned && (
            <span className="px-3 py-1 rounded-full text-xs font-sans font-semibold bg-brand-accent/20 border border-brand-accent/40 text-brand-accent flex items-center gap-1.5 shadow-sm">
              <Pin className="w-3.5 h-3.5 fill-current" />
              <span>Pinned Signature Repertoire</span>
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-brand-text/10 text-brand-text">
            ECO {repertoire.eco}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-brand-secondary">
          <span>Mastery: <strong className="text-brand-accent font-bold">{repertoire.masteryRate}%</strong></span>
          <span>Students: <strong className="text-brand-text font-bold">{repertoire.enrolledStudents.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Main Grid: Interactive Board (Left 5 Cols) + Variation Breakdown (Right 7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Playable Mini Chessboard (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-2xl overflow-hidden border-2 border-brand-accent/40 shadow-[0_16px_40px_rgba(0,0,0,0.6)] bg-obsidian">
            <ThemedChessboard
              options={{
                position: repertoire.fens[currentStepIndex] || repertoire.fens[0],
                boardOrientation: repertoire.side,
                showNotation: false,
                allowDragging: false,
              }}
            />
            <BoardCoordinates boardOrientation={repertoire.side} />
          </div>

          {/* Position counter — below the board to avoid overlapping pieces */}
          <div className="flex items-center justify-center mt-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-black/70 border border-white/20 text-[11px] font-mono text-amber-300 font-bold shadow-sm">
              Position {currentStepIndex + 1} of {repertoire.fens.length}
            </span>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => handleStep(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
              className="px-3 py-1.5 rounded-xl bg-brand-text/10 hover:bg-brand-text/20 disabled:opacity-40 text-brand-text font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => handleStep(0)}
              className="px-3 py-1.5 rounded-xl bg-brand-text/10 hover:bg-brand-text/20 text-brand-text font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              onClick={() => handleStep(Math.min(repertoire.fens.length - 1, currentStepIndex + 1))}
              disabled={currentStepIndex === repertoire.fens.length - 1}
              className="px-3 py-1.5 rounded-xl bg-brand-accent text-obsidian disabled:opacity-40 font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Repertoire Details (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-brand-text">
              {repertoire.title}
            </h3>
            <p className="text-xs sm:text-sm font-sans text-brand-secondary mt-1 leading-relaxed">
              {repertoire.description}
            </p>
          </div>

          {/* Highlight Move Callout Box */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-brand-accent/40 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-brand-accent">
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-brand-accent fill-current" />
                <span>Alex's Signature Move: {repertoire.highlightMove}</span>
              </span>
            </div>
            <p className="text-xs font-sans text-brand-text leading-relaxed">
              "{repertoire.highlightNote}"
            </p>
          </div>

          {/* Interactive Move Sequence Buttons */}
          <div className="space-y-1.5">
            <span className="text-xs font-mono text-brand-secondary uppercase font-semibold">
              Move Sequence (Click to jump board position):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {repertoire.moves.map((mv, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStep(Math.min(repertoire.fens.length - 1, Math.floor(idx / 3)))}
                  className="px-2.5 py-1 rounded-lg bg-brand-text/5 hover:bg-brand-accent/20 border border-brand-text/10 text-brand-text font-mono text-xs font-medium transition-colors cursor-pointer"
                >
                  {mv}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
