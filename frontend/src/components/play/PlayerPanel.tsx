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
  isLive: boolean;
  isBot?: boolean;
}

export function PlayerPanel({
  userId,
  label,
  name,
  image,
  presenceState,
  remainingMs,
  lastMoveAt,
  isLive,
  isBot,
}: PlayerPanelProps) {
  const isYou = label.toLowerCase() === "you";

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-2 h-[62px] backdrop-blur-xl transition-colors ${
        isLive
          ? "bg-brand-surface/90 border-brand-accent/60 ring-1 ring-brand-accent/40"
          : "bg-brand-surface/50 border-white/10 opacity-90"
      }`}
    >
      {/* Left: Player Crest & Identity */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <OpponentIdentity userId={userId} label={label} name={name} image={image} size={28} isBot={isBot} />
        <ConnectionIndicator state={presenceState} className="pl-[36px]" />
      </div>

      {/* Right: High-Contrast Turn Status Badge & SideClock */}
      <div className="flex items-center gap-2 shrink-0">
        {isLive && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider font-extrabold shrink-0 ${
              isYou
                ? "bg-emerald-500/15 border border-emerald-600/40 text-emerald-950 dark:text-emerald-300 dark:bg-emerald-500/20 dark:border-emerald-500/50"
                : "bg-amber-500/15 border border-amber-600/40 text-amber-950 dark:text-amber-300 dark:bg-amber-500/25 dark:border-amber-500/50"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isYou ? "bg-emerald-600 dark:bg-emerald-400" : "bg-amber-600 dark:bg-amber-400"
              }`}
            />
            {isYou ? "Your Turn" : "Opponent's Turn"}
          </span>
        )}
        <SideClock remainingMs={remainingMs} lastMoveAt={lastMoveAt} isLive={isLive} label={label} />
      </div>
    </div>
  );
}
