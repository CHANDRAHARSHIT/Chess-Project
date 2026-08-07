/**
 * ResultRevealModal.tsx
 * Grows out of the board rather than a generic full-screen modal — reuses the existing
 * .checkmate-overlay-badge glass treatment. Win/loss/draw is carried by composition and
 * headline text, never by adding a second red/green palette (M5 plan §4.2, Inconsistency I-3).
 *
 * Note on ratings: the GameResult contract carries no rating delta — Results computes and
 * persists ratings asynchronously, decoupled from Session's broadcast (Invariant: Session never
 * blocks on Results). A rated game's delta is only ever visible later via game history, never
 * live here — this modal states that honestly rather than showing a fabricated number.
 */
import { useEffect, useRef } from "react";
import { Trophy, ShieldAlert, Scale, Swords } from "lucide-react";
import confetti from "canvas-confetti";
import { soundManager } from "../../utils/SoundManager";
import type { GameResult, TerminationReason } from "../../types/multiplayer";

const REASON_LABEL: Record<TerminationReason, string> = {
  checkmate: "Checkmate",
  stalemate: "Stalemate",
  draw_agreement: "Draw by Agreement",
  draw_repetition: "Draw by Repetition",
  draw_fifty_move: "Draw — Fifty-Move Rule",
  draw_insufficient_material: "Draw — Insufficient Material",
  resignation: "Resignation",
  timeout: "Time Expiry",
  forfeit: "Forfeit",
  abort: "Aborted",
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const primaryBtn =
  "px-7 py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold btn-premium-cta btn-glow-container btn-glow-accent cta-shine cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2";

const outlineBtn =
  "px-6 py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-semibold border border-brand-border/60 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 bg-brand-surface/60 backdrop-blur-md transition-all cursor-pointer";

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
        // Confetti is decorative — never block the result from rendering.
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

  const title = isDraw ? "Match Drawn" : isWin ? "Victory!" : "Defeat";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
      aria-describedby="result-reason"
      className="absolute inset-0 z-30 bg-brand-bg/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center rounded-2xl"
    >
      <div className="relative overflow-hidden rounded-3xl border-2 border-brand-accent/50 bg-brand-surface/95 p-8 space-y-4 max-w-md w-full">
        {/* Top Icon Badge */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
          {isWin ? (
            <Trophy className="w-7 h-7 text-amber-400" />
          ) : isDraw ? (
            <Scale className="w-7 h-7 text-brand-accent" />
          ) : (
            <ShieldAlert className="w-7 h-7 text-rose-400" />
          )}
        </div>

        <div className="space-y-1">
          <h2 id="result-title" className="font-display text-3xl sm:text-4xl font-extrabold text-brand-text tracking-tight">
            {title}
          </h2>
          <p id="result-reason" className="font-mono text-xs uppercase tracking-widest text-brand-accent font-semibold">
            {REASON_LABEL[result.terminationReason]}
          </p>
        </div>

        <div className="h-px w-full bg-brand-border/40 my-2" />

        <div className="flex justify-center items-center gap-4 font-mono text-xs text-brand-secondary">
          <span>{result.moveCount} moves played</span>
          {typeof result.durationSeconds === "number" && (
            <>
              <span>•</span>
              <span>{formatDuration(result.durationSeconds)} duration</span>
            </>
          )}
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-brand-bg/60 border border-brand-border/40 font-mono text-[10px] uppercase tracking-wider text-brand-secondary/80">
          {result.rated ? "Rated Match · Rating Updates Shortly" : "Casual Match · Rating Unaffected"}
        </div>
      </div>

      {/* Primary & Secondary Action CTAs */}
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <button ref={primaryBtnRef} onClick={onFindAnother} className={primaryBtn}>
          <Swords className="w-4 h-4" />
          Find Another Game
        </button>
        <button onClick={onBackToLobby} className={outlineBtn}>
          Return to Lobby
        </button>
      </div>
    </div>
  );
}
