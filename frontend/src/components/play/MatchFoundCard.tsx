/**
 * MatchFoundCard.tsx
 * The match-found handoff moment — shows the real Chess960 starting position (one of 960)
 * and side assignment, then dissolves into the live game. Chess-specific, not a generic
 * "Match found! Starting in 3…2…1" spinner (M5 plan §4.2).
 */
import { useEffect } from "react";
import { Zap } from "lucide-react";
import { ThemedChessboard } from "../ThemedChessboard";
import { OpponentIdentity } from "./OpponentIdentity";
import { useSession } from "../../hooks/useSession";
import { generateStartingFenFromPositionId } from "../../utils/chess960PositionId";
import type { MatchDescriptor } from "../../types/multiplayer";

const HANDOFF_DELAY_MS = 1800;

interface MatchFoundCardProps {
  descriptor: MatchDescriptor;
  onEnter: () => void;
}

export function MatchFoundCard({ descriptor, onEnter }: MatchFoundCardProps) {
  const { session } = useSession();
  const myUserId = session?.user?.id ?? null;

  const mine = descriptor.participants.find((p) => p.userId === myUserId);
  const opponent = descriptor.participants.find((p) => p.userId !== myUserId);
  const mySide = mine?.side ?? 0;
  const positionId =
    typeof descriptor.variantParams.positionId === "number" ? descriptor.variantParams.positionId : 0;
  const fen = generateStartingFenFromPositionId(positionId);

  useEffect(() => {
    const t = window.setTimeout(onEnter, HANDOFF_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [onEnter]);

  return (
    <div className="reveal-in relative overflow-hidden flex flex-col items-center gap-6 rounded-3xl border border-brand-accent/40 bg-gradient-to-b from-brand-surface/95 to-brand-bg/95 backdrop-blur-2xl p-6 sm:p-8 max-w-md w-full mx-auto shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,110,0.15)]">
      {/* Decorative background ambient glow */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full bg-brand-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-brand-accent/10 blur-3xl" />

      {/* Match Found Header */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-brand-accent font-bold px-3 py-1 rounded-full bg-brand-accent/15 border border-brand-accent/30 shadow-[0_0_15px_rgba(212,175,110,0.2)]">
          <Zap className="w-3.5 h-3.5 fill-brand-accent animate-pulse" />
          Match Confirmed
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-text tracking-tight">
          Preparing Arena
        </h2>
      </div>

      {/* Face-off Players Banner */}
      <div className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-brand-bg/60 border border-brand-border/40">
        <div className="flex flex-col items-start min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-wider text-brand-accent font-semibold">
            {mySide === 0 ? "White Side" : "Black Side"}
          </span>
          <span className="font-sans font-bold text-sm text-brand-text truncate">You</span>
        </div>

        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-surface border border-brand-border/60 text-brand-accent font-mono text-xs font-bold shrink-0">
          VS
        </div>

        <div className="flex flex-col items-end min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-wider text-brand-secondary font-semibold">
            {mySide === 0 ? "Black Side" : "White Side"}
          </span>
          {opponent ? (
            <OpponentIdentity userId={opponent.userId} label="Opponent" size={24} />
          ) : (
            <span className="font-sans text-xs text-brand-secondary">Opponent</span>
          )}
        </div>
      </div>

      {/* Starting Position Preview Card */}
      <div className="relative group rounded-2xl overflow-hidden border border-brand-accent/30 shadow-2xl p-1 bg-brand-surface/80">
        <div className="w-44 sm:w-52 aspect-square border border-brand-border/60 rounded-xl overflow-hidden pointer-events-none">
          <ThemedChessboard
            options={{
              position: fen,
              boardOrientation: mySide === 1 ? "black" : "white",
              showNotation: false,
              allowDragging: false,
            }}
          />
        </div>
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-brand-bg/90 border border-brand-border/60 backdrop-blur-md font-mono text-[10px] text-brand-accent uppercase tracking-wider font-semibold">
          Pos #{positionId}
        </div>
      </div>

      {/* Handoff Details & Progress Bar */}
      <div className="w-full text-center space-y-3">
        <div className="font-mono text-xs text-brand-secondary">
          Time Control: <span className="text-brand-text font-bold">{descriptor.timeControl.label}</span>
        </div>

        {/* Animated Loading Bar */}
        <div className="relative h-1.5 w-full bg-brand-surface rounded-full overflow-hidden border border-brand-border/40">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-accent/60 via-brand-accent to-brand-accent rounded-full animate-[progress_1.8s_ease-in-out_infinite] w-full" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-brand-secondary/80">
          Entering Live Session...
        </span>
      </div>
    </div>
  );
}
