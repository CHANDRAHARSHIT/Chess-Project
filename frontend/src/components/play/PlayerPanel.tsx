import { OpponentIdentity } from "./OpponentIdentity";
import { ConnectionIndicator, type PresenceState } from "./ConnectionIndicator";
import { SideClock } from "./SideClock";

interface PlayerPanelProps {
  userId: string;
  label: string;
  name?: string;
  image?: string;
  presenceState: PresenceState;
  remainingMs: number;
  lastMoveAt: number | null;
  gameStartTime?: number | null;
  isLive: boolean;
}

export function PlayerPanel({
  userId,
  label,
  name,
  image,
  presenceState,
  remainingMs,
  lastMoveAt,
  gameStartTime,
  isLive,
}: PlayerPanelProps) {
  const isYou = label.toLowerCase() === "you";

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2 backdrop-blur-xl transition-all duration-[var(--dur-quick)] shadow-md ${
        isLive
          ? "bg-brand-surface/90 border-brand-accent/60 shadow-[0_0_18px_rgba(212,175,110,0.2)] ring-1 ring-brand-accent/40"
          : "bg-brand-surface/50 border-white/10 opacity-90"
      }`}
    >
      {/* Left: Player Crest & Identity */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <OpponentIdentity userId={userId} label={label} name={name} image={image} size={28} />
        <ConnectionIndicator state={presenceState} className="pl-[36px]" />
      </div>

      {/* Right: High-Contrast Turn Status Badge & SideClock */}
      <div className="flex items-center gap-2 shrink-0">
        {isLive && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider font-extrabold shrink-0 shadow-sm ${
              isYou
                ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-800 dark:text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)] animate-pulse"
                : "bg-amber-500/25 border border-amber-500/50 text-amber-900 dark:text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isYou ? "bg-emerald-500 animate-ping" : "bg-amber-500 animate-ping"
              }`}
            />
            {isYou ? "Your Turn" : "Opponent's Turn"}
          </span>
        )}
        <SideClock
          remainingMs={remainingMs}
          lastMoveAt={lastMoveAt}
          gameStartTime={gameStartTime}
          isLive={isLive}
          label={label}
        />
      </div>
    </div>
  );
}
