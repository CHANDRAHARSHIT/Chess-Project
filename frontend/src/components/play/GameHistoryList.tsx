import { useEffect, useState } from "react";
import { History, Trophy, Clock } from "lucide-react";
import { GamesService, type GameHistoryEntry } from "../../services/games.service";
import { MultiplayerDisabledError } from "../../services/matchmaking.service";

type LoadState = "loading" | "empty" | "error" | "loaded" | "unavailable";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const RESULT_PILL: Record<string, { label: string; badge: string }> = {
  WIN: {
    label: "VICTORY",
    badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  },
  LOSS: {
    label: "DEFEAT",
    badge: "bg-rose-500/10 border-rose-500/20 text-rose-400",
  },
  DRAW: {
    label: "DRAW",
    badge: "bg-brand-surface/40 border-white/10 text-brand-secondary",
  },
};

export function GameHistoryList() {
  const [state, setState] = useState<LoadState>("loading");
  const [entries, setEntries] = useState<GameHistoryEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    GamesService.getHistory()
      .then((data) => {
        if (cancelled) return;
        setEntries(data);
        setState(data.length === 0 ? "empty" : "loaded");
      })
      .catch((err) => {
        if (cancelled) return;
        setState(err instanceof MultiplayerDisabledError ? "unavailable" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-3xl border border-brand-text/15 bg-brand-surface overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-white/10 bg-brand-surface/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-brand-accent" />
          <h3 className="font-display font-bold text-base text-brand-text tracking-tight">
            Recent Games
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-brand-secondary">
          Game History
        </span>
      </div>

      <div className="p-4 space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-brand-border/40 flex-1">
        {state === "loading" &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-brand-surface/30 animate-pulse border border-white/5" />
          ))}

        {state === "empty" && (
          <div className="py-12 text-center text-sm text-brand-secondary flex flex-col items-center gap-2">
            <Trophy className="w-8 h-8 text-brand-secondary/30" />
            <p className="font-medium text-brand-text/80">No games recorded yet</p>
            <p className="text-xs max-w-xs">Your finished online games will be tracked here.</p>
          </div>
        )}

        {(state === "error" || state === "unavailable") && (
          <div className="py-12 text-center text-xs text-brand-secondary">
            Couldn't load game history.
          </div>
        )}

        {state === "loaded" &&
          entries.map((entry) => {
            const style = RESULT_PILL[entry.result] ?? RESULT_PILL.DRAW;
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-xl bg-brand-bg/30 border border-white/5 hover:border-brand-accent/30 hover:bg-brand-surface/50 transition-all duration-[var(--dur-quick)]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-md border font-mono text-[10px] font-bold tracking-wider shrink-0 ${style.badge}`}
                  >
                    {style.label}
                  </span>
                  <span className="text-xs text-brand-text font-medium truncate capitalize">
                    {entry.gameRecord.terminationReason.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs text-brand-secondary/80 shrink-0">
                  {typeof entry.ratingDelta === "number" && (
                    <span
                      className={`font-bold ${
                        entry.ratingDelta >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {entry.ratingDelta >= 0 ? "+" : ""}
                      {entry.ratingDelta}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-brand-secondary/50" />
                    {timeAgo(entry.gameRecord.endedAt)}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
