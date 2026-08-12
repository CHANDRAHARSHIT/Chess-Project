/**
 * OpeningCoachPanel.tsx
 *
 * Displays the coach image (/public/coach.png), a contextual coaching message,
 * and the move history for the current training session.
 */

import type { TrainerStatus } from "@/features/openings/useOpeningTrainer";

interface OpeningCoachPanelProps {
  coachMessage: string;
  status: TrainerStatus;
  movesPlayed: string[];
}

export function OpeningCoachPanel({
  coachMessage,
  status,
  movesPlayed,
}: OpeningCoachPanelProps) {
  const messageColor =
    status === "wrong"
      ? "#f87171" // rose-400
      : status === "complete"
      ? "#34d399" // emerald-400
      : "var(--text-primary)"; // brand text

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Coach avatar */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full overflow-hidden shrink-0 border"
          style={{ borderColor: "rgba(212,175,110,0.30)" }}
        >
          <img
            src="/coach.png"
            alt="Coach"
            className="w-full h-full object-cover object-top"
            draggable={false}
          />
        </div>
        <div>
          <p
            className="font-display text-sm font-semibold"
            style={{ color: "rgba(212,175,110,0.9)" }}
          >
            Coach
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-brand-secondary">
            Opening Trainer
          </p>
        </div>
      </div>

      {/* Speech bubble */}
      <div
        className="rounded-xl px-4 py-3 flex-1"
        style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border-gold)",
        }}
      >
        <p
          className="font-sans text-sm leading-relaxed transition-colors duration-300"
          style={{ color: messageColor }}
        >
          {coachMessage}
        </p>
      </div>

      {/* Move history */}
      {movesPlayed.length > 0 && (
        <div className="mt-auto">
          <p className="font-mono text-[10px] uppercase tracking-widest text-brand-secondary mb-2">
            Moves Played
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {movesPlayed.map((san, i) => {
              const isWhiteMove = i % 2 === 0;
              const moveNumber = Math.floor(i / 2) + 1;
              return (
                <span
                  key={i}
                  className="font-mono text-xs px-1.5 py-0.5 rounded"
                  style={{
                   background: isWhiteMove
                   ? "rgba(212,175,110,0.12)"
                   : "var(--glass-bg)",

                   color: isWhiteMove
                   ? "rgba(212,175,110,0.9)"
                   : "var(--text-secondary)",

                   border: `1px solid ${
                   isWhiteMove
                   ? "rgba(212,175,110,0.20)"
                   : "var(--glass-border)"
                    }`,
                  }}
                >
                  {isWhiteMove ? `${moveNumber}. ` : ""}
                  {san}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
