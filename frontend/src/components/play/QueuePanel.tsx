import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Swords, Shield, Clock, Search, XCircle, RefreshCw, Cpu } from "lucide-react";
import BoardPreview from "../BoardPreview";
import { useMatchmaking } from "../../hooks/useMatchmaking";
import { soundManager } from "../../utils/SoundManager";

function formatMinSec(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

// elapsed and remaining always sum to exactly the ticket TTL (60s) — floor() on the count-up
// and ceil() on the count-down keeps that sum exact at every tick. Using the same rounding
// (e.g. ceil for both) drifts the pair up to 1s apart, e.g. "0:01" elapsed next to "1:00"
// remaining at the very first tick.
function formatElapsed(ms: number): string {
  return formatMinSec(Math.floor(ms / 1000));
}

function formatRemaining(ms: number): string {
  return formatMinSec(Math.ceil(ms / 1000));
}

const primaryBtn =
  "px-7 py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold btn-premium-cta btn-glow-container btn-glow-accent cta-shine cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2.5 min-h-[48px]";

const outlineBtn =
  "px-5 py-2.5 rounded-xl font-mono text-[11px] uppercase tracking-widest font-semibold border border-rose-500/30 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all duration-[var(--dur-quick)] inline-flex items-center gap-2 cursor-pointer";

export function QueuePanel() {
  const { phase, ticket, errorMessage, findGame, cancelSearch } = useMatchmaking();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const startAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "searching" || !ticket) return;
    startAtRef.current = ticket.enqueuedAt;

    const tick = () => {
      const now = Date.now();
      setElapsedMs(now - (startAtRef.current ?? now));
      setRemainingMs(Math.max(0, ticket.expiresAt - now));
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [phase, ticket]);

  const handleFindGame = () => {
    soundManager.playButtonClick();
    findGame();
  };

  const handleCancel = () => {
    soundManager.playButtonClick();
    cancelSearch();
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-brand-text/15 bg-brand-surface p-6 sm:p-8 transition-all">
      {/* Decorative subtle ambient background glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-accent/5 blur-3xl" />

      <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
        {/* Left: Board preview & format tags */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 shrink-0 p-4 rounded-2xl bg-brand-text/5 border border-brand-text/10 w-full sm:w-auto">
          <div className="relative shrink-0 rounded-2xl overflow-hidden border border-brand-text/15">
            <BoardPreview size={140} />
          </div>

          <div className="flex flex-col gap-1.5 text-center sm:text-left lg:text-center">
            <span className="font-display font-semibold text-base text-brand-text">Fischer Random</span>
            <div className="flex flex-wrap justify-center sm:justify-start lg:justify-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-accent/10 border border-brand-accent/20 font-mono text-[10px] uppercase tracking-wider text-brand-accent font-medium">
                <Clock className="w-3 h-3" /> 5+3 Blitz
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-text/5 border border-brand-text/10 font-mono text-[10px] uppercase tracking-wider text-brand-secondary">
                <Shield className="w-3 h-3" /> Casual
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Play Action */}
        <div className="flex-1 w-full flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-4 min-w-0">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-brand-accent mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
              Online Match
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-text tracking-tight">
              Play Live Match
            </h2>
            <p className="text-xs sm:text-sm text-brand-secondary mt-1 max-w-md">
              Play against live opponents online with fair random starting positions and live clocks.
            </p>
          </div>

          {phase === "searching" && (
            <div className="w-full space-y-4 p-4 rounded-xl bg-brand-bg/40 border border-brand-accent/30 backdrop-blur-md">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent border border-brand-accent/30">
                    <Search className="w-4 h-4 animate-spin" />
                    <span className="absolute inset-0 rounded-lg ring-2 ring-brand-accent/30 animate-ping" />
                  </div>
                  <div className="text-left">
                    <div className="font-mono text-xs font-semibold text-brand-text uppercase tracking-wider">
                      Searching for Opponent
                    </div>
                    <div className="font-mono text-[11px] text-brand-secondary">
                      Finding an online player...
                    </div>
                  </div>
                </div>

                <button onClick={handleCancel} className={outlineBtn}>
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              </div>

              {/* Progress Sweep Bar */}
              <div className="relative h-1.5 w-full bg-brand-surface/60 rounded-full overflow-hidden border border-white/5">
                <div className="absolute inset-y-0 bg-gradient-to-r from-brand-accent/40 via-brand-accent to-brand-accent/40 animate-pulse w-full clock-flag-sweep" />
              </div>

              <div className="flex items-center justify-between font-mono text-xs pt-1 border-t border-white/5">
                <span className="text-brand-text flex items-center gap-1.5">
                  <span className="text-brand-secondary">Elapsed:</span>
                  <span className="font-bold text-brand-accent">{formatElapsed(elapsedMs)}</span>
                </span>
                <span className="text-brand-secondary flex items-center gap-1.5">
                  <span>Expires in:</span>
                  <span className="font-bold text-brand-text">{formatRemaining(remainingMs)}</span>
                </span>
              </div>
            </div>
          )}

          {phase === "expired" && (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-brand-secondary bg-amber-500/10 border border-amber-500/20 text-amber-200 px-4 py-3 rounded-xl">
                No opponent joined within 60 seconds. Click below to try again.
              </p>
              <button onClick={handleFindGame} className={primaryBtn}>
                <RefreshCw className="w-4 h-4" />
                Find Match Again
              </button>
            </div>
          )}

          {phase === "error" && (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-xl">
                Couldn't join the queue: {errorMessage ?? "The server rejected the request."}
              </p>
              <button onClick={handleFindGame} className={primaryBtn}>
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}

          {phase === "unavailable" && (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-brand-secondary bg-brand-text/5 border border-brand-text/10 px-4 py-3 rounded-xl">
                Online play isn't open yet. XLChess is rolling multiplayer out gradually. Chess 960 against the engine is available now.
              </p>
              <Link to="/play/chess960" className={primaryBtn}>
                <Cpu className="w-4 h-4" />
                Play the Engine
              </Link>
            </div>
          )}

          {(phase === "idle" || phase === "cancelled") && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button onClick={handleFindGame} className={primaryBtn}>
                <Swords className="w-4.5 h-4.5" />
                Find Match
              </button>
              <span className="font-mono text-[11px] text-brand-secondary/80">
                Estimated wait ~ 15s
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
