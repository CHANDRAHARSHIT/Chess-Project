/**
 * StatsPage.tsx
 *
 * V1 placeholder dashboard for /stats.
 * All data is hardcoded — no backend integration required.
 */
import { Swords, TrendingUp, Target, Trophy, ChevronRight } from "lucide-react";

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const OVERVIEW_CARDS = [
  {
    id: "rapid-rating",
    label: "Rapid Rating",
    value: "1,450",
    sub: "↑ 32 this month",
    subPositive: true,
    icon: Swords,
    accent: "text-brand-accent",
    bg: "bg-brand-accent/10",
    border: "border-brand-accent/20",
  },
  {
    id: "win-loss-draw",
    label: "Win / Loss / Draw",
    value: "120 · 85 · 20",
    sub: "225 total games",
    subPositive: null,
    icon: TrendingUp,
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    id: "puzzle-accuracy",
    label: "Puzzle Accuracy",
    value: "78%",
    sub: "↑ 4% from last week",
    subPositive: true,
    icon: Target,
    accent: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  {
    id: "highest-rating",
    label: "Highest Rating",
    value: "1,520",
    sub: "Achieved Feb 2025",
    subPositive: null,
    icon: Trophy,
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
];

const OPENINGS = [
  { name: "Sicilian Defense", winRate: 65, games: 42 },
  { name: "Queen's Gambit", winRate: 58, games: 37 },
  { name: "King's Indian Attack", winRate: 52, games: 29 },
  { name: "Ruy López", winRate: 44, games: 21 },
];

const RECENT_MATCHES = [
  {
    opponent: "Magnus_Fan88",
    result: "Win",
    ratingChange: "+8",
    timeControl: "10+0",
  },
  {
    opponent: "ChessWizard99",
    result: "Loss",
    ratingChange: "-5",
    timeControl: "10+0",
  },
  {
    opponent: "NightKnight42",
    result: "Win",
    ratingChange: "+9",
    timeControl: "5+3",
  },
  {
    opponent: "QueenGambit22",
    result: "Draw",
    ratingChange: "+1",
    timeControl: "10+0",
  },
  {
    opponent: "TacticsKing7",
    result: "Win",
    ratingChange: "+10",
    timeControl: "15+10",
  },
];

// ─── SVG Rating Line ──────────────────────────────────────────────────────────
// A decorative polyline that evokes a rating chart without real data.
const CHART_POINTS =
  "50,130 120,110 200,120 290,80 370,95 440,60 520,75 600,40 680,55 750,30 820,45 900,20";

// ─── Sub-components ──────────────────────────────────────────────────────────

function OverviewCard({ card }: { card: (typeof OVERVIEW_CARDS)[number] }) {
  const Icon = card.icon;
  return (
    <div
      className={`flex flex-col gap-3 p-5 rounded-2xl border bg-brand-surface/30 ${card.border} hover:border-opacity-60 hover:bg-brand-surface/50 transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold uppercase tracking-widest text-brand-secondary/70">
          {card.label}
        </span>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bg} ${card.accent}`}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <p
        className={`text-2xl font-bold font-sans tracking-tight ${card.accent}`}
      >
        {card.value}
      </p>
      <p
        className={`text-xs font-sans ${
          card.subPositive === true
            ? "text-emerald-400"
            : card.subPositive === false
              ? "text-red-400"
              : "text-brand-secondary/60"
        }`}
      >
        {card.sub}
      </p>
    </div>
  );
}

function OpeningBar({ opening }: { opening: (typeof OPENINGS)[number] }) {
  const barColor =
    opening.winRate >= 60
      ? "bg-emerald-500"
      : opening.winRate >= 50
        ? "bg-brand-accent"
        : "bg-red-400";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-sans text-brand-text font-medium">
          {opening.name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-brand-secondary/60 text-xs font-mono">
            {opening.games} games
          </span>
          <span
            className={`font-mono font-bold text-xs ${
              opening.winRate >= 60
                ? "text-emerald-400"
                : opening.winRate >= 50
                  ? "text-brand-accent"
                  : "text-red-400"
            }`}
          >
            {opening.winRate}%
          </span>
        </div>
      </div>
      <div className="w-full h-2 rounded-full bg-brand-border/30 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${opening.winRate}%` }}
        />
      </div>
    </div>
  );
}

function MatchRow({ match }: { match: (typeof RECENT_MATCHES)[number] }) {
  const isWin = match.result === "Win";
  const isDraw = match.result === "Draw";

  const resultStyle = isWin
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
    : isDraw
      ? "bg-brand-accent/15 text-brand-accent border-brand-accent/25"
      : "bg-red-500/15 text-red-400 border-red-500/25";

  const changeStyle = match.ratingChange.startsWith("+")
    ? "text-emerald-400"
    : match.ratingChange === "+1" || match.ratingChange === "0"
      ? "text-brand-secondary"
      : "text-red-400";

  return (
    <div className="flex items-center justify-between py-3 border-b border-brand-border/20 last:border-0 group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-surface/60 border border-brand-border/40 flex items-center justify-center text-brand-secondary text-xs font-bold shrink-0">
          {match.opponent.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-sans font-medium text-brand-text group-hover:text-brand-accent transition-colors">
            {match.opponent}
          </span>
          <span className="text-[11px] text-brand-secondary/50 font-mono">
            {match.timeControl} Rapid
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${resultStyle}`}
        >
          {match.result}
        </span>
        <span
          className={`text-sm font-mono font-bold w-8 text-right ${changeStyle}`}
        >
          {match.ratingChange}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-brand-border/40 group-hover:text-brand-accent transition-colors" />
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col gap-8">
        {/* ── Page Header ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-brand-text tracking-tight">
              Your Stats (Coming Soon)
            </h1>
            <p className="text-sm text-brand-secondary font-sans">
              Performance overview for your account
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-brand-border/40 text-brand-secondary/60">
            V1 · Preview Data
          </span>
        </div>

        {/* ── Section 1: Quick Overview Cards ───────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {OVERVIEW_CARDS.map((card) => (
            <OverviewCard key={card.id} card={card} />
          ))}
        </div>

        {/* ── Section 2: Rating Trends Chart ────────────────────────── */}
        <div className="flex flex-col gap-4 p-6 rounded-2xl border border-brand-border/40 bg-brand-surface/30">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-base font-bold text-brand-text tracking-tight">
                Rating Trends
              </h2>
              <p className="text-xs text-brand-secondary/60 font-sans">
                Rapid rating · Last 90 days
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-brand-secondary/50 font-mono">
              <span className="w-2 h-2 rounded-full bg-brand-accent" />
              Rapid
            </div>
          </div>

          {/* Chart area */}
          <div className="relative w-full h-52 rounded-xl overflow-hidden bg-brand-bg/60 border border-brand-border/20">
            {/* Grid lines */}
            <svg
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="none"
              aria-hidden
            >
              {/* Horizontal grid lines */}
              {[0.25, 0.5, 0.75].map((frac) => (
                <line
                  key={frac}
                  x1="0"
                  y1={`${frac * 100}%`}
                  x2="100%"
                  y2={`${frac * 100}%`}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="1"
                />
              ))}
              {/* Vertical grid lines */}
              {[0.2, 0.4, 0.6, 0.8].map((frac) => (
                <line
                  key={frac}
                  x1={`${frac * 100}%`}
                  y1="0"
                  x2={`${frac * 100}%`}
                  y2="100%"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="1"
                />
              ))}
            </svg>

            {/* Rating line (decorative SVG) */}
            <svg
              viewBox="0 0 950 160"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="none"
              aria-hidden
            >
              {/* Area fill under the line */}
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="rgb(212,175,110)"
                    stopOpacity="0.25"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(212,175,110)"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
              <polygon
                points={`50,160 ${CHART_POINTS} 900,160`}
                fill="url(#chartFill)"
              />
              {/* The line itself */}
              <polyline
                points={CHART_POINTS}
                fill="none"
                stroke="rgb(212,175,110)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
              {/* Highlight dot at the tip */}
              <circle cx="900" cy="20" r="4" fill="rgb(212,175,110)" />
              <circle
                cx="900"
                cy="20"
                r="8"
                fill="rgb(212,175,110)"
                opacity="0.2"
              />
            </svg>

            {/* Y-axis labels */}
            <div className="absolute left-2 inset-y-0 flex flex-col justify-between py-2 pointer-events-none">
              {["1520", "1490", "1460", "1430"].map((label) => (
                <span
                  key={label}
                  className="text-[10px] font-mono text-brand-secondary/40"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between px-1">
            {["May", "Jun", "Jul", "Aug"].map((m) => (
              <span
                key={m}
                className="text-[10px] font-mono text-brand-secondary/40"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* ── Section 3: Openings + Recent Matches ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Opening Success Rates */}
          <div className="flex flex-col gap-5 p-6 rounded-2xl border border-brand-border/40 bg-brand-surface/30">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-base font-bold text-brand-text tracking-tight">
                Opening Success Rates
              </h2>
              <p className="text-xs text-brand-secondary/60 font-sans">
                Win % as White &amp; Black combined
              </p>
            </div>
            <div className="flex flex-col gap-5">
              {OPENINGS.map((opening) => (
                <OpeningBar key={opening.name} opening={opening} />
              ))}
            </div>
            <p className="text-[11px] text-brand-secondary/40 font-mono mt-1">
              Based on your last 129 rated games
            </p>
          </div>

          {/* Right: Recent Matches */}
          <div className="flex flex-col gap-4 p-6 rounded-2xl border border-brand-border/40 bg-brand-surface/30">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-base font-bold text-brand-text tracking-tight">
                Recent Matches
              </h2>
              <p className="text-xs text-brand-secondary/60 font-sans">
                Last 5 rapid games
              </p>
            </div>
            <div className="flex flex-col">
              {RECENT_MATCHES.map((match) => (
                <MatchRow key={match.opponent} match={match} />
              ))}
            </div>
            <button className="w-full mt-1 py-2.5 rounded-xl border border-brand-border/30 text-xs font-mono font-semibold uppercase tracking-widest text-brand-secondary/60 hover:text-brand-text hover:border-brand-accent/30 transition-all duration-200">
              View Full Match History
            </button>
          </div>
        </div>

        {/* Footer note */}
        <div className="flex items-center justify-center py-2">
          <p className="text-xs text-brand-secondary/40 font-sans text-center">
            Full stats integration — live rating history, puzzle streaks, and
            ELO tracking — is coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
