/**
 * OpeningCompletionCard.tsx
 *
 * Shown when the user has successfully played through an entire opening.
 * Displays the opening name, moves played, and a "Play Again" button.
 */

import { Check, RotateCcw } from "lucide-react";
import type { Opening } from "@/types/openings-openings.types";

interface OpeningCompletionCardProps {
  opening: Opening;
  movesPlayed: string[];
  onPlayAgain: () => void;
}

export function OpeningCompletionCard({
  opening,
  movesPlayed,
  onPlayAgain,
}: OpeningCompletionCardProps) {
  return (
    <div
      className="w-full max-w-[480px] sm:max-w-[520px] rounded-2xl p-8 flex flex-col items-center gap-6 text-center bg-brand-surface/85 border border-emerald-500/25"
    >
      {/* Success icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center bg-emerald-500/10 border-2 border-emerald-500/35"
      >
        <Check className="w-8 h-8 text-emerald-400" strokeWidth={2.5} />
      </div>

      {/* Title */}
      <div className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-400/70">
          Opening Completed!
        </p>
        <h2 className="font-display text-xl sm:text-2xl font-semibold text-brand-text">
          {opening.name}
        </h2>
        {opening.eco && (
          <span className="font-mono text-[10px] text-brand-accent/60 uppercase tracking-widest">
            ECO {opening.eco}
          </span>
        )}
      </div>

      {/* Stats */}
      <div
        className="flex gap-6 px-6 py-3 rounded-xl w-full justify-center bg-brand-text/5 border border-brand-border"
      >
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-display text-2xl font-bold text-brand-text">
            {movesPlayed.length}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-brand-secondary">
            Moves Played
          </span>
        </div>
        <div
          className="w-px self-stretch bg-brand-text/10"
        />
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-display text-2xl font-bold text-emerald-400">
            100%
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-brand-secondary">
            Completed
          </span>
        </div>
      </div>

      {/* Moves list */}
      <div className="w-full">
        <p className="font-mono text-[10px] uppercase tracking-widest text-brand-secondary mb-2">
          Full Move Sequence
        </p>
        <p className="font-mono text-xs text-brand-secondary/70 leading-relaxed">
          {movesPlayed.join(" ")}
        </p>
      </div>

      {/* Action button */}
      <button
        onClick={onPlayAgain}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold bg-brand-text/5 border border-brand-border hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text transition-all duration-200 cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Play Again
      </button>
    </div>
  );
}
