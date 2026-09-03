/**
 * SubscriptionsPage.tsx
 *
 * V1 placeholder UI for /subscriptions.
 * Uses the three channels that appear in the sidebar:
 *   - Chess Network
 *   - Grandmaster Insights
 *   - Endgame Masters
 *
 * All data is hardcoded — no backend integration required.
 */
import { PlayCircle, BookOpen, Radio, Crown } from "lucide-react";
import { BackButton } from "@/components/molecules/BackButton";

// ─── Channels ────────────────────────────────────────────────────────────────

const CHANNELS = [
  {
    id: 1,
    name: "Chess Network",
    initials: "CN",
    color: "bg-sky-700",
    tagline: "Opening theory & live games",
  },
  {
    id: 2,
    name: "Grandmaster Insights",
    initials: "GI",
    color: "bg-amber-700",
    tagline: "GM-level strategy & analysis",
  },
  {
    id: 3,
    name: "Endgame Masters",
    initials: "EM",
    color: "bg-emerald-800",
    tagline: "Endgame technique & precision",
  },
];

// ─── Content Feed ─────────────────────────────────────────────────────────────

type ContentType = "video" | "lesson" | "live";

interface ContentItem {
  id: number;
  title: string;
  channel: string;
  channelInitials: string;
  channelColor: string;
  timestamp: string;
  type: ContentType;
  duration: string;
  views: string;
}

const CONTENT: ContentItem[] = [
  {
    id: 1,
    title: "Interactive Lesson: Pawn Endgames — King Activity & Opposition",
    channel: "Endgame Masters",
    channelInitials: "EM",
    channelColor: "bg-emerald-800",
    timestamp: "2 hours ago",
    type: "lesson",
    duration: "34:22",
    views: "11K views",
  },
  {
    id: 2,
    title: "LIVE: World Championship Game 6 Analysis",
    channel: "Grandmaster Insights",
    channelInitials: "GI",
    channelColor: "bg-amber-700",
    timestamp: "4 hours ago",
    type: "live",
    duration: "1:18:40",
    views: "28K views",
  },
  {
    id: 3,
    title: "Course: Sicilian Defense — Najdorf Variation from Scratch",
    channel: "Chess Network",
    channelInitials: "CN",
    channelColor: "bg-sky-700",
    timestamp: "Yesterday",
    type: "lesson",
    duration: "52:10",
    views: "23K views",
  },
  {
    id: 4,
    title: "Interactive Lesson: Queen vs. Rook Endgame Step-by-Step",
    channel: "Endgame Masters",
    channelInitials: "EM",
    channelColor: "bg-emerald-800",
    timestamp: "2 days ago",
    type: "lesson",
    duration: "27:48",
    views: "8.2K views",
  },
  {
    id: 5,
    title: "Course: Positional Chess — Weak Squares & Outposts",
    channel: "Grandmaster Insights",
    channelInitials: "GI",
    channelColor: "bg-amber-700",
    timestamp: "3 days ago",
    type: "lesson",
    duration: "44:05",
    views: "19K views",
  },
  {
    id: 6,
    title: "Interactive Lesson: Tactical Patterns — Discovered Attacks",
    channel: "Chess Network",
    channelInitials: "CN",
    channelColor: "bg-sky-700",
    timestamp: "4 days ago",
    type: "lesson",
    duration: "31:17",
    views: "14K views",
  },
  {
    id: 7,
    title: "Course: Rook Endings — Lucena & Philidor Positions",
    channel: "Endgame Masters",
    channelInitials: "EM",
    channelColor: "bg-emerald-800",
    timestamp: "5 days ago",
    type: "lesson",
    duration: "38:50",
    views: "10K views",
  },
  {
    id: 8,
    title: "Interactive Lesson: Opening Principles for Club Players",
    channel: "Chess Network",
    channelInitials: "CN",
    channelColor: "bg-sky-700",
    timestamp: "6 days ago",
    type: "lesson",
    duration: "25:40",
    views: "16K views",
  },
  {
    id: 9,
    title: "Why Magnus Plays 1.e4 — A Deep Grandmaster Perspective",
    channel: "Grandmaster Insights",
    channelInitials: "GI",
    channelColor: "bg-amber-700",
    timestamp: "1 week ago",
    type: "video",
    duration: "52:13",
    views: "34K views",
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function ContentTypeBadge({ type }: { type: ContentType }) {
  const styles: Record<ContentType, string> = {
    live: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    lesson: "bg-brand-accent/15 text-brand-accent border-brand-accent/30",
    video: "bg-brand-text/5 text-brand-secondary border-brand-text/15",
  };
  const Icon =
    type === "live" ? Radio : type === "lesson" ? BookOpen : PlayCircle;
  const label =
    type === "live" ? "LIVE" : type === "lesson" ? "Lesson" : "Video";

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${styles[type]}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function ThumbnailPlaceholder({
  type,
  duration,
  title,
}: {
  type: ContentType;
  duration: string;
  title: string;
}) {
  const isLive = type === "live";
  const Icon = type === "lesson" ? BookOpen : PlayCircle;
  const iconStyle =
    isLive
      ? "bg-red-500/20 text-red-400"
      : type === "lesson"
        ? "bg-brand-accent/20 text-brand-accent"
        : "bg-brand-text/10 text-brand-secondary";

  return (
    <div className="relative w-full aspect-video bg-brand-bg rounded-2xl overflow-hidden border border-brand-text/20 group-hover:border-brand-accent/40 transition-colors">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-surface via-brand-bg to-brand-surface/40" />
      {/* Subtle chess-pattern texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-conic-gradient(currentColor 0% 25%, transparent 0% 50%)",
          backgroundSize: "20px 20px",
        }}
      />
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-md ${iconStyle}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {/* Bottom-right badge */}
      <div className="absolute bottom-2 right-2">
        {isLive ? (
          <span className="flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold font-mono uppercase px-2.5 py-0.5 rounded-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        ) : (
          <span className="bg-black/80 border border-white/20 text-white text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md shadow-sm">
            {duration}
          </span>
        )}
      </div>
      <span className="sr-only">{title}</span>
    </div>
  );
}

function ContentCard({ item }: { item: ContentItem }) {
  return (
    <div className="group relative w-full rounded-3xl border border-brand-text/15 bg-brand-surface p-5 transition-all duration-300 hover:border-brand-accent/50 cursor-pointer overflow-hidden flex flex-col justify-between">
      <div className="space-y-3">
        <ThumbnailPlaceholder
          type={item.type}
          duration={item.duration}
          title={item.title}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <ContentTypeBadge type={item.type} />
            <span className="text-[11px] text-brand-secondary font-mono">{item.views}</span>
          </div>

          <h3 className="font-display font-bold text-brand-text text-base leading-snug line-clamp-2 group-hover:text-brand-accent transition-colors duration-150">
            {item.title}
          </h3>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-brand-text/10 flex items-center justify-between text-xs font-sans text-brand-secondary">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 ${item.channelColor}`}
          >
            {item.channelInitials}
          </div>
          <span className="text-xs text-brand-text font-medium truncate">
            {item.channel}
          </span>
        </div>
        <span className="text-xs text-brand-secondary shrink-0 whitespace-nowrap">
          {item.timestamp}
        </span>
      </div>
    </div>
  );
}

function ChannelAvatar({
  channel,
}: {
  channel: (typeof CHANNELS)[number];
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 cursor-pointer group shrink-0 min-w-[80px]">
      <div className="relative p-0.5 rounded-full bg-gradient-to-br from-brand-accent/50 to-brand-accent/15 group-hover:from-brand-accent group-hover:to-brand-accent/40 transition-all duration-200">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-base select-none shadow-md ${channel.color}`}
        >
          {channel.initials}
        </div>
      </div>
      <div className="flex flex-col items-center gap-0.5 max-w-[88px]">
        <span className="text-[11px] text-brand-text group-hover:text-brand-accent transition-colors duration-150 text-center font-sans font-semibold leading-tight line-clamp-2">
          {channel.name}
        </span>
        <span className="text-[10px] text-brand-secondary text-center leading-tight line-clamp-1">
          {channel.tagline}
        </span>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col gap-8">
        {/* Back Navigation */}
        <div>
          <BackButton to="/" label="Back to Home" />
        </div>

        {/* ── Page Header ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-display font-bold text-brand-text tracking-tight">
              Subscriptions
            </h1>
            <p className="text-sm text-brand-secondary font-sans">
              Latest content from your subscribed channels
            </p>
          </div>
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-border bg-brand-surface/60 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 transition-all duration-200 text-sm font-sans cursor-pointer">
            <Crown className="w-4 h-4 text-brand-accent" />
            Manage
          </button>
        </div>

        {/* ── Section 1: Subscribed Channels ────────────────────────── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-brand-secondary uppercase tracking-widest font-mono">
            Subscribed Channels
          </h2>
          <div className="flex items-start gap-8 overflow-x-auto pb-1 no-scrollbar">
            {CHANNELS.map((channel) => (
              <ChannelAvatar key={channel.id} channel={channel} />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-text/10 to-transparent" />

        {/* ── Section 2: Latest Content Feed ────────────────────────── */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-brand-secondary uppercase tracking-widest font-mono">
              Latest Uploads
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-brand-secondary font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
              Updated just now
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CONTENT.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* Footer note */}
        <div className="flex items-center justify-center py-4">
          <p className="text-xs text-brand-secondary font-sans text-center leading-relaxed">
            Full creator subscriptions, notifications, and channel management
            are coming soon.
            <br />
            The content above is a preview of the final experience.
          </p>
        </div>

      </div>
    </div>
  );
}
