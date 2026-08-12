/**
 * ResultRevealModal.tsx
 * Container-query responsive game completion overlay embedded inside the board container.
 * High-contrast, structured outcome display (Victory, Defeat, Draw, Stalemate)
 * without in-animations or drop-shadows.
 *
 * Sizing is intentionally compact by default (not "shrink from large"), so it
 * fits inside the board container without scrolling at typical board sizes.
 * Stat cards and CTAs stay in a single row at all widths — stacking them
 * vertically is what caused the previous overflow.
 */
import { useEffect, useRef } from "react";
import { Trophy, ShieldAlert, Scale, Swords, type LucideIcon } from "lucide-react";
import confetti from "canvas-confetti";
import { soundManager } from "@/utils/SoundManager";
import type { GameResult, TerminationReason } from "@/types/multiplayer";

interface OutcomeStyle {
  pill: string;
  pillStyle: string;
  ringStyle: string;
  icon: LucideIcon;
  title: string;
  titleStyle: string;
  subtitleStyle: string;
}

const OUTCOME_CONFIG: Record<"victory" | "defeat" | "draw", OutcomeStyle> = {
  victory: {
    pill: "VICTORY TRIUMPH",
    pillStyle: "bg-emerald-500/15 border border-emerald-500/40 text-emerald-950 dark:text-emerald-300 font-extrabold",
    ringStyle: "bg-brand-accent/15 border border-brand-accent/40 text-brand-accent",
    icon: Trophy,
    title: "Victory!",
    titleStyle: "text-brand-accent",
    subtitleStyle: "text-emerald-950 dark:text-emerald-300 font-extrabold",
  },
  defeat: {
    pill: "MATCH CONCLUDED",
    pillStyle: "bg-rose-500/15 border border-rose-500/40 text-rose-950 dark:text-rose-300 font-extrabold",
    ringStyle: "bg-rose-500/15 border border-rose-500/40 text-rose-400",
    icon: ShieldAlert,
    title: "Defeat",
    titleStyle: "text-brand-text",
    subtitleStyle: "text-rose-950 dark:text-rose-300 font-extrabold",
  },
  draw: {
    pill: "EQUAL STANDING",
    pillStyle: "bg-amber-500/15 border border-amber-500/40 text-amber-950 dark:text-amber-300 font-extrabold",
    ringStyle: "bg-amber-500/15 border border-amber-500/40 text-amber-400",
    icon: Scale,
    title: "Match Drawn",
    titleStyle: "text-brand-text",
    subtitleStyle: "text-amber-950 dark:text-amber-300 font-extrabold",
  },
};

const TERMINATION_LABEL: Record<TerminationReason, string> = {
  checkmate: "BY CHECKMATE",
  stalemate: "STALEMATE",
  draw_agreement: "DRAW BY AGREEMENT",
  draw_repetition: "DRAW BY REPETITION",
  draw_fifty_move: "FIFTY-MOVE RULE",
  draw_insufficient_material: "INSUFFICIENT MATERIAL",
  resignation: "BY RESIGNATION",
  timeout: "TIME EXPIRY",
  forfeit: "FORFEIT",
  abort: "ABORTED",
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface ResultRevealModalProps {
  result: GameResult;
  myUserId: string;
  onFindAnother: () => void;
  onBackToLobby: () => void;
}

export function ResultRevealModal({ result, myUserId, onFindAnother, onBackToLobby }: ResultRevealModalProps) {
  const mySide = result.participants.find((p) => p.userId === myUserId)?.side;
  const isDraw = result.outcome.kind === "draw";
  const isWin = result.outcome.kind === "win" && result.outcome.winningSide === mySide;

  const outcomeKey: "victory" | "defeat" | "draw" = isWin ? "victory" : isDraw ? "draw" : "defeat";
  const config = OUTCOME_CONFIG[outcomeKey];
  const IconComponent = config.icon;

  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isWin) {
      soundManager.playApplause();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.55 },
          colors: ["#D4AF6E", "#10B981", "#F59E0B", "#FFFFFF", "#3B82F6"],
        });
      } catch {
        // Confetti is decorative — never block result display
      }
    } else if (isDraw) {
      soundManager.playGameEnd();
    } else {
      soundManager.playLose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    primaryBtnRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBackToLobby();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
      aria-describedby="result-reason"
      className="@container absolute inset-0 z-30 bg-brand-bg/95 backdrop-blur-xl flex flex-col items-center justify-center gap-4 p-4 text-center rounded-2xl overflow-y-auto min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* Top Section: Outcome Pill & Signature Emblem Ring */}
      <div className="flex flex-col items-center gap-2 w-full max-w-sm">
        {/* Outcome Status Pill */}
        <div className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-widest ${config.pillStyle}`}>
          {config.pill}
        </div>

        {/* Signature Emblem Ring */}
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${config.ringStyle}`}>
          <IconComponent className="w-5 h-5" />
        </div>

        {/* Outcome Title & Termination Reason */}
        <div className="space-y-0">
          <h2
            id="result-title"
            className={`font-display text-2xl @[300px]:text-3xl font-extrabold tracking-tight leading-tight ${config.titleStyle}`}
          >
            {config.title}
          </h2>
          <p
            id="result-reason"
            className={`font-mono text-[10px] uppercase tracking-widest ${config.subtitleStyle}`}
          >
            {TERMINATION_LABEL[result.terminationReason]}
          </p>
        </div>
      </div>

      {/* Middle Section: Structured 3-Card Stat Grid — always one row, never stacked */}
      <div className="grid grid-cols-3 gap-1.5 w-full max-w-sm">
        <div className="flex flex-col items-center justify-center px-1.5 py-2 rounded-xl bg-brand-surface/80 border border-white/10 text-center min-w-0">
          <span className="font-mono text-[8px] uppercase tracking-wider text-brand-secondary/80 font-bold">
            Moves
          </span>
          <span className="font-mono text-xs font-extrabold text-brand-text mt-0.5">
            {result.moveCount}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center px-1.5 py-2 rounded-xl bg-brand-surface/80 border border-white/10 text-center min-w-0">
          <span className="font-mono text-[8px] uppercase tracking-wider text-brand-secondary/80 font-bold">
            Duration
          </span>
          <span className="font-mono text-xs font-extrabold text-brand-text mt-0.5">
            {formatDuration(result.durationSeconds ?? 0)}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center px-1.5 py-2 rounded-xl bg-brand-surface/80 border border-white/10 text-center min-w-0">
          <span className="font-mono text-[8px] uppercase tracking-wider text-brand-secondary/80 font-bold">
            Mode
          </span>
          <span className="font-mono text-xs font-extrabold text-brand-accent mt-0.5">
            {result.rated ? "Rated" : "Casual"}
          </span>
        </div>
      </div>

      {/* Bottom Section: Action CTAs — always one row, never stacked */}
      <div className="flex flex-row justify-center gap-2 w-full max-w-sm">
        <button
          ref={primaryBtnRef}
          onClick={onFindAnother}
          className="flex-1 px-3 py-2.5 rounded-xl font-mono text-[10px] uppercase tracking-widest font-bold bg-brand-accent text-brand-bg hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 outline-none cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
        >
          <Swords className="w-3.5 h-3.5 shrink-0" />
          <span>Find Another Game</span>
        </button>

        <button
          onClick={onBackToLobby}
          className="flex-1 px-3 py-2.5 rounded-xl font-mono text-[10px] uppercase tracking-widest font-bold border border-white/10 bg-brand-surface/80 text-brand-text hover:bg-brand-surface focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 outline-none cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Return to Lobby</span>
        </button>
      </div>
    </div>
  );
}