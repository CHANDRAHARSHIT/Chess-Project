/**
 * ConnectionIndicator.tsx
 * Reports one presence fact (mine, or the opponent's). Never colour alone — every state
 * pairs a distinct glyph with a DM Mono word, per the accessibility bar in the M5 plan §9.
 */
export type PresenceState = "live" | "reconnecting" | "offline" | "unknown";

const LABEL: Record<PresenceState, string> = {
  live: "Live",
  reconnecting: "Reconnecting",
  offline: "Offline",
  unknown: "Unknown",
};

const COLOR: Record<PresenceState, string> = {
  live: "text-brand-accent",
  reconnecting: "text-brand-secondary",
  offline: "text-rose-400",
  unknown: "text-brand-secondary/50",
};

function StatusDot({ state }: { state: PresenceState }) {
  if (state === "live") {
    return (
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent" />
      </span>
    );
  }
  if (state === "reconnecting") {
    return (
      <span className="h-2 w-2 rounded-full border border-brand-secondary border-t-transparent animate-spin inline-block shrink-0" />
    );
  }
  if (state === "offline") {
    return <span className="h-2 w-2 rounded-full bg-rose-500 inline-block shrink-0" />;
  }
  return <span className="h-2 w-2 rounded-full bg-brand-secondary/40 inline-block shrink-0" />;
}

interface ConnectionIndicatorProps {
  state: PresenceState;
  title?: string;
  className?: string;
}

export function ConnectionIndicator({ state, title, className = "" }: ConnectionIndicatorProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider ${COLOR[state]} ${className}`}
      title={title}
    >
      <StatusDot state={state} />
      <span>{LABEL[state]}</span>
    </span>
  );
}
