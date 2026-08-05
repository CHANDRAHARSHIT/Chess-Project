/**
 * SideClock.tsx — "Flagfall": the clock IS the turn indicator.
 *
 * There is no separate "your turn" badge anywhere in the UI — the side to move renders at
 * full weight over a gold rule; the idle side fades. Below 30s the display switches to
 * tenths; below 10s a hairline sweeps the plate once a second (see .clock-flag-sweep in
 * index.css); at 0 the plate inverts and freezes. The client never declares a flag itself —
 * it only renders the server's `remainingMs`, interpolated between updates (M5 plan §7.2).
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

    if (!isLive || lastMoveAt === null) {
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

  const isFlagged = displayMs <= 0;
  const isCritical = isLive && displayMs <= CRITICAL_THRESHOLD_MS && !isFlagged;
  const accessibleSeconds = Math.ceil(Math.max(0, displayMs) / 1000);

  return (
    <div
      role="timer"
      aria-label={`${label}: ${accessibleSeconds} seconds remaining`}
      className={`relative overflow-hidden rounded-xl border px-4 py-2 min-w-[88px] text-center transition-all duration-[var(--dur-instant)] ${
        isFlagged
          ? "clock-plate--flagged border-rose-500 bg-rose-500/20 text-rose-300 font-bold"
          : isLive
            ? "bg-brand-accent/15 border-brand-accent/60 text-brand-accent shadow-[0_0_12px_rgba(212,175,110,0.2)]"
            : "bg-brand-bg/60 border-brand-border/40 text-brand-secondary/80"
      }`}
    >
      <span
        aria-hidden="true"
        className={`font-mono tabular-nums tracking-wider transition-all duration-[var(--dur-instant)] ${
          isCritical
            ? "text-xl font-extrabold text-rose-400 animate-pulse"
            : isLive
              ? "text-lg font-bold text-brand-accent"
              : "text-base font-medium text-brand-secondary"
        }`}
      >
        {formatClock(displayMs)}
      </span>
      {isCritical && <div className="clock-flag-sweep" />}
    </div>
  );
}
