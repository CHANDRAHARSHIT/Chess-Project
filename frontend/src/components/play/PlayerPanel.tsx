import { OpponentIdentity } from "./OpponentIdentity";
import { ConnectionIndicator, type PresenceState } from "./ConnectionIndicator";
import { SideClock } from "./SideClock";

interface PlayerPanelProps {
  userId: string;
  label: string;
  presenceState: PresenceState;
  remainingMs: number;
  lastMoveAt: number | null;
  isLive: boolean;
}

export function PlayerPanel({
  userId,
  label,
  presenceState,
  remainingMs,
  lastMoveAt,
  isLive,
}: PlayerPanelProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl transition-all duration-[var(--dur-quick)] shadow-md ${
        isLive
          ? "bg-brand-surface/90 border-brand-accent/40 shadow-[0_0_15px_rgba(212,175,110,0.12)]"
          : "bg-brand-surface/40 border-white/5 opacity-90"
      }`}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <OpponentIdentity userId={userId} label={label} size={32} />
        <ConnectionIndicator state={presenceState} className="pl-[42px]" />
      </div>
      <SideClock remainingMs={remainingMs} lastMoveAt={lastMoveAt} isLive={isLive} label={label} />
    </div>
  );
}
