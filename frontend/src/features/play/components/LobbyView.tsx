import { useEffect } from "react";
import { Swords, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { QueuePanel } from "./QueuePanel";
import { GameHistoryList } from "./GameHistoryList";
import { LeaderboardPanel } from "./LeaderboardPanel";

export function LobbyView({ historyRefreshKey }: { historyRefreshKey: number }) {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const targetId = hash.replace("#", "");
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-8 animate-fade-in">
      {/* Hero Header & Quick Specs */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-brand-text/15 bg-brand-surface p-4 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent shrink-0">
              <Swords className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-brand-text tracking-tight">
                Play Chess Online
              </h1>
              <p className="text-sm text-brand-secondary max-w-lg">
                Play against live opponents in real time. Experience Fischer Random (Chess960) with instant pairing.
              </p>
            </div>
          </div>

          {/* Quick Info Badges */}
          <div className="flex flex-wrap md:flex-col lg:flex-row items-center gap-2.5 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-brand-text/10 md:pl-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-text/5 border border-brand-text/10 font-mono text-xs text-brand-secondary">
              <Zap className="w-3.5 h-3.5 text-brand-accent" />
              <span>5+3 Blitz</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-text/5 border border-brand-text/10 font-mono text-xs text-brand-secondary">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quick Pairing</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-text/5 border border-brand-text/10 font-mono text-xs text-brand-secondary">
              <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
              <span>Fischer Random</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Matchmaking Card */}
      <QueuePanel />

      {/* History & Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div id="recent-games" className="scroll-mt-6">
          <GameHistoryList key={historyRefreshKey} />
        </div>
        <div id="leaderboard" className="scroll-mt-6">
          <LeaderboardPanel />
        </div>
      </div>
    </div>
  );
}
