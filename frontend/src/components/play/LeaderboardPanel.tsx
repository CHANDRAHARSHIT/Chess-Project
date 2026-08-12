import { useEffect, useState } from "react";
import { Award, Crown, User } from "lucide-react";
import { GamesService, type LeaderboardEntry } from "../../services/games.service";
import { MultiplayerDisabledError } from "../../services/matchmaking.service";

type LoadState = "loading" | "empty" | "error" | "loaded";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold shrink-0">
        <Crown className="w-3.5 h-3.5 text-amber-400" />
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-300/20 border border-slate-300/30 text-slate-200 font-mono text-xs font-bold shrink-0">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 border border-amber-700/30 text-amber-500 font-mono text-xs font-bold shrink-0">
        3
      </span>
    );
  }
  return (
    <span className="flex items-center justify-center w-6 h-6 font-mono text-xs text-brand-secondary/60 shrink-0">
      {rank}
    </span>
  );
}

export function LeaderboardPanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    GamesService.getLeaderboard("chess960")
      .then((data) => {
        if (cancelled) return;
        setEntries(data);
        setState(data.length === 0 ? "empty" : "loaded");
      })
      .catch((err) => {
        if (cancelled) return;
        setState(err instanceof MultiplayerDisabledError ? "empty" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-3xl border border-brand-text/15 bg-brand-surface overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-white/10 bg-brand-surface/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-brand-accent" />
          <h3 className="font-display font-bold text-base text-brand-text tracking-tight">
            Leaderboard
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-brand-accent px-2 py-0.5 rounded bg-brand-accent/10 border border-brand-accent/20">
          Chess960
        </span>
      </div>

      <div className="p-4 space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-brand-border/40 flex-1">
        {state === "loading" &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-brand-surface/30 animate-pulse border border-white/5" />
          ))}

        {state === "empty" && (
          <div className="py-12 text-center text-sm text-brand-secondary flex flex-col items-center gap-2">
            <Crown className="w-8 h-8 text-brand-secondary/30" />
            <p className="font-medium text-brand-text/80">No ranked players yet</p>
            <p className="text-xs max-w-xs">
              Online play is currently casual. Elo ratings will populate as competitive play opens.
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="py-12 text-center text-xs text-brand-secondary">
            Couldn't load the leaderboard.
          </div>
        )}

        {state === "loaded" &&
          entries.map((entry, i) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 rounded-xl bg-brand-bg/30 border border-white/5 hover:border-brand-accent/30 hover:bg-brand-surface/50 transition-all duration-[var(--dur-quick)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <RankBadge rank={i + 1} />
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-brand-surface border border-white/10 flex items-center justify-center text-brand-accent text-xs font-semibold shrink-0">
                    {entry.user.name ? entry.user.name[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs text-brand-text font-medium truncate">
                    {entry.user.name ?? "Anonymous"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 font-mono text-xs font-bold text-brand-accent bg-brand-accent/10 px-2.5 py-1 rounded-md border border-brand-accent/20 shrink-0">
                {entry.rating} <span className="text-[10px] text-brand-secondary font-normal">Elo</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
