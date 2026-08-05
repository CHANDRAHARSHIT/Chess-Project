/**
 * SubscriptionsPage.tsx
 *
 * V1 placeholder UI for /subscriptions.
 * All data is hardcoded — no backend integration required.
 */
import { PlayCircle, BookOpen, Radio, Crown } from "lucide-react";

// ─── Dummy Data ──────────────────────────────────────────────────────────────

const CREATORS = [
  {
    id: 1,
    name: "GM Benjamin Finegold",
    initials: "BF",
    color: "bg-amber-700",
    subscribers: "142K",
  },
  {
    id: 2,
    name: "ChessMaster99",
    initials: "CM",
    color: "bg-indigo-700",
    subscribers: "89K",
  },
  {
    id: 3,
    name: "GothamChessXL",
    initials: "GC",
    color: "bg-red-800",
    subscribers: "310K",
  },
  {
    id: 4,
    name: "IM Anna Cramling",
    initials: "AC",
    color: "bg-pink-700",
    subscribers: "201K",
  },
  {
    id: 5,
    name: "TacticsTitan",
    initials: "TT",
    color: "bg-emerald-800",
    subscribers: "55K",
  },
  {
    id: 6,
    name: "EndgamePro",
    initials: "EP",
    color: "bg-sky-800",
    subscribers: "38K",
  },
];

type ContentType = "video" | "lesson" | "live";

interface ContentItem {
  id: number;
  title: string;
  creator: string;
  creatorInitials: string;
  creatorColor: string;
  timestamp: string;
  type: ContentType;
  duration: string;
  views: string;
}

const CONTENT: ContentItem[] = [
  {
    id: 1,
    title: "Mastering the Sicilian Defense — Najdorf Variation Deep Dive",
    creator: "GM Benjamin Finegold",
    creatorInitials: "BF",
    creatorColor: "bg-amber-700",
    timestamp: "2 hours ago",
    type: "video",
    duration: "38:14",
    views: "12K views",
  },
  {
    id: 2,
    title: "LIVE: Titled Tuesday Blitz Tournament Analysis",
    creator: "GothamChessXL",
    creatorInitials: "GC",
    creatorColor: "bg-red-800",
    timestamp: "5 hours ago",
    type: "live",
    duration: "1:22:07",
    views: "31K views",
  },
  {
    id: 3,
    title: "Rook Endgames: The Lucena Position Explained",
    creator: "EndgamePro",
    creatorInitials: "EP",
    creatorColor: "bg-sky-800",
    timestamp: "Yesterday",
    type: "lesson",
    duration: "24:50",
    views: "8.4K views",
  },
  {
    id: 4,
    title: "Opening Traps Every Beginner Should Know",
    creator: "ChessMaster99",
    creatorInitials: "CM",
    creatorColor: "bg-indigo-700",
    timestamp: "2 days ago",
    type: "video",
    duration: "18:33",
    views: "22K views",
  },
  {
    id: 5,
    title: "The King's Indian Attack — Full Opening Course",
    creator: "IM Anna Cramling",
    creatorInitials: "AC",
    creatorColor: "bg-pink-700",
    timestamp: "3 days ago",
    type: "lesson",
    duration: "1:04:20",
    views: "47K views",
  },
  {
    id: 6,
    title: "Top 10 Most Brilliant Tactics of 2025",
    creator: "TacticsTitan",
    creatorInitials: "TT",
    creatorColor: "bg-emerald-800",
    timestamp: "4 days ago",
    type: "video",
    duration: "29:11",
    views: "15K views",
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function ContentTypeIcon({ type }: { type: ContentType }) {
  if (type === "live") return <Radio className="w-4 h-4" />;
  if (type === "lesson") return <BookOpen className="w-4 h-4" />;
  return <PlayCircle className="w-4 h-4" />;
}

function ContentTypeBadge({ type }: { type: ContentType }) {
  const styles: Record<ContentType, string> = {
    live: "bg-red-500/20 text-red-400 border-red-500/30",
    lesson: "bg-brand-accent/15 text-brand-accent border-brand-accent/25",
    video: "bg-brand-text/10 text-brand-secondary border-brand-text/10",
  };
  const labels: Record<ContentType, string> = {
    live: "LIVE",
    lesson: "Lesson",
    video: "Video",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${styles[type]}`}
    >
      <ContentTypeIcon type={type} />
      {labels[type]}
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
  return (
    <div className="relative w-full aspect-video bg-brand-bg rounded-xl overflow-hidden group-hover:brightness-90 transition-all duration-200">
      {/* Subtle gradient texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-surface via-brand-bg to-black opacity-80" />
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${isLive
            ? "bg-red-500/20 text-red-400"
            : type === "lesson"
              ? "bg-brand-accent/20 text-brand-accent"
              : "bg-brand-text/10 text-brand-secondary"
            }`}
        >
          {type === "lesson" ? (
            <BookOpen className="w-6 h-6" />
          ) : (
            <PlayCircle className="w-6 h-6" />
          )}
        </div>
      </div>
      {/* Chess-pattern subtle overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Duration / LIVE badge */}
      <div className="absolute bottom-2 right-2">
        {isLive ? (
          <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        ) : (
          <span className="bg-black/70 text-brand-text text-[11px] font-mono px-1.5 py-0.5 rounded">
            {duration}
          </span>
        )}
      </div>
      {/* Invisible overlay title for a11y */}
      <span className="sr-only">{title}</span>
    </div>
  );
}

function ContentCard({ item }: { item: ContentItem }) {
  return (
    <div className="group flex flex-col gap-3 bg-brand-surface/40 border border-brand-border/40 hover:border-brand-accent/25 rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:bg-brand-surface/70 hover:shadow-lg hover:shadow-black/20">
      <ThumbnailPlaceholder
        type={item.type}
        duration={item.duration}
        title={item.title}
      />

      <div className="flex flex-col gap-2">
        {/* Type badge */}
        <ContentTypeBadge type={item.type} />

        {/* Title */}
        <h3 className="font-semibold text-brand-text text-sm leading-snug line-clamp-2 group-hover:text-brand-accent transition-colors duration-150">
          {item.title}
        </h3>

        {/* Creator + meta */}
        <div className="flex items-center gap-2 mt-0.5">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 ${item.creatorColor}`}
          >
            {item.creatorInitials}
          </div>
          <span className="text-xs text-brand-secondary font-sans truncate">
            {item.creator}
          </span>
          <span className="text-brand-border/60 text-xs shrink-0">·</span>
          <span className="text-xs text-brand-secondary/60 font-sans shrink-0">
            {item.timestamp}
          </span>
        </div>

        {/* Views */}
        <p className="text-[11px] text-brand-secondary/50 font-mono">
          {item.views}
        </p>
      </div>
    </div>
  );
}

function CreatorAvatar({ creator }: { creator: (typeof CREATORS)[number] }) {
  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer group shrink-0">
      {/* Avatar ring */}
      <div className="relative p-0.5 rounded-full bg-gradient-to-br from-brand-accent/60 to-brand-accent/20 group-hover:from-brand-accent group-hover:to-brand-accent/50 transition-all duration-200">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-base select-none ${creator.color}`}
        >
          {creator.initials}
        </div>
      </div>
      <span className="text-[11px] text-brand-secondary group-hover:text-brand-text transition-colors duration-150 text-center font-sans leading-tight max-w-[72px] line-clamp-2">
        {creator.name}
      </span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col gap-10">

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-brand-text tracking-tight">
              Subscriptions
            </h1>
            <p className="text-sm text-brand-secondary font-sans">
              Latest content from creators you follow
            </p>
          </div>
          {/* Manage subscriptions — placeholder action */}
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-border/50 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 transition-all duration-200 text-sm font-sans">
            <Crown className="w-4 h-4 text-brand-accent" />
            Manage
          </button>
        </div>

        {/* ── Section 1: Subscribed Creators ───────────────────────────── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-brand-secondary uppercase tracking-widest font-mono">
            Creators You Follow
          </h2>
          {/* Horizontal scrollable row */}
          <div className="flex items-start gap-6 overflow-x-auto pb-2 no-scrollbar">
            {CREATORS.map((creator) => (
              <CreatorAvatar key={creator.id} creator={creator} />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-accent/15 to-transparent" />

        {/* ── Section 2: Latest Content Feed ───────────────────────────── */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-brand-secondary uppercase tracking-widest font-mono">
              Latest Uploads
            </h2>
            <div className="flex items-center gap-1 text-xs text-brand-secondary/60 font-sans">
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

        {/* ── Footer hint ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-center py-4">
          <p className="text-xs text-brand-secondary/40 font-sans text-center">
            Creator channels, subscriptions, and notifications are coming soon.
            <br />
            The content above is a preview of what the feed will look like.
          </p>
        </div>

      </div>
    </div>
  );
}
