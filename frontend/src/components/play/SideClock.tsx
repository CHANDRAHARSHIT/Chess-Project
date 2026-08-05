/**
 * SideClock.tsx — "Flagfall": the clock IS the turn indicator.
 *
 * Sized and styled with clean glass backdrop, avoiding harsh/opaque fills.
 * Displays tenths below 30s; below 10s a hairline sweeps the plate.
 */
import { useEffect, useState } from "react";

const LOW_THRESHOLD_MS = 30_000;
const CRITICAL_THRESHOLD_MS = 10_000;

function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  if (clamped <= LOW_THRESHOLD_MS) {
    return (clamped / 1000).toFixed(1);
  }
  const totalSeconds = Math.floor(clamped / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface SideClockProps {
  remainingMs: number;
  lastMoveAt: number | null;
  isLive: boolean;
  label: string;
}

export function SideClock({ remainingMs, lastMoveAt, isLive, label }: SideClockProps) {
  const [displayMs, setDisplayMs] = useState(remainingMs);

  useEffect(() => {
    let timer: number | null = null;

    // lastMoveAt is the server's own clock anchor — null until the session's first move is
    // actually submitted (Session never charges time before then). Ticking from anything else
    // (e.g. a local "match ready" timestamp) would show time elapsing that the server was never
    // going to deduct, so the display would visibly snap back the instant the real state_update
    // arrives after the first move.
    if (!isLive || !lastMoveAt) {
      timer = window.setTimeout(() => setDisplayMs(remainingMs), 0);
      return () => {
        if (timer !== null) window.clearTimeout(timer);
      };
    }

    const tick = () => {
      const elapsed = Date.now() - lastMoveAt;
      const remaining = Math.max(0, remainingMs - elapsed);
      setDisplayMs(remaining);
      if (remaining <= 0) return;
      const interval = remaining <= LOW_THRESHOLD_MS ? 100 : 1000;
      timer = window.setTimeout(tick, interval);
    };
    timer = window.setTimeout(tick, 0);

    return () => {
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [remainingMs, lastMoveAt, isLive]);

  const isFlagged = isLive && displayMs <= 0;
  const isCritical = isLive && displayMs <= CRITICAL_THRESHOLD_MS && !isFlagged;
  const accessibleSeconds = Math.ceil(Math.max(0, displayMs) / 1000);

  return (
    <div
      role="timer"
      aria-label={`${label}: ${accessibleSeconds} seconds remaining`}
      className={`relative overflow-hidden rounded-xl border px-3.5 py-1.5 min-w-[76px] text-center transition-all duration-[var(--dur-instant)] backdrop-blur-md ${
        isFlagged
          ? "clock-plate--flagged border-rose-500 bg-rose-500/20 text-rose-400 font-bold"
          : isLive
            ? "bg-brand-accent/15 border-brand-accent/50 text-brand-accent shadow-[0_0_10px_rgba(212,175,110,0.15)]"
            : "bg-brand-surface/60 border-white/10 text-brand-secondary/80"
      }`}
    >
      <span
        aria-hidden="true"
        className={`font-mono tabular-nums tracking-wider transition-all duration-[var(--dur-instant)] ${
          isCritical
            ? "text-lg font-extrabold text-rose-400 animate-pulse"
            : isLive
              ? "text-base font-bold text-brand-accent"
              : "text-sm font-semibold text-brand-secondary"
        }`}
      >
        {formatClock(displayMs)}
      </span>
      {isCritical && <div className="clock-flag-sweep" />}
    </div>
  );
}
