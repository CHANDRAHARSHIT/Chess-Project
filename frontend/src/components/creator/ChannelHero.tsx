/**
 * ChannelHero.tsx
 *
 * Hero Header Banner for Alex Vance's Channel Showcase (/channel).
 * Fully theme-aware for light and dark modes.
 */

import { useState } from "react";
import { Radio, Share2, Sparkles, Award } from "lucide-react";
import { soundManager } from "../../utils/SoundManager";
import type { CreatorProfile } from "../../data/creatorMockData";

interface ChannelHeroProps {
  profile: CreatorProfile;
}

export function ChannelHero({ profile }: ChannelHeroProps) {
  const [liveStatus, setLiveStatus] = useState<"recording" | "live" | "offline">(profile.liveStatus);
  const [sharedToast, setSharedToast] = useState(false);

  const toggleStatus = () => {
    soundManager.playButtonClick();
    const next = liveStatus === "recording" ? "live" : liveStatus === "live" ? "offline" : "recording";
    setLiveStatus(next);
  };

  const handleShare = () => {
    soundManager.playButtonClick();
    setSharedToast(true);
    setTimeout(() => setSharedToast(false), 2500);
  };

  return (
    <div className="relative w-full rounded-3xl border border-brand-accent/30 bg-brand-surface p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Top Header Grid */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        {/* Left: Avatar & Identity */}
        <div className="flex items-center gap-5">
          {/* Avatar with dynamic live status ring */}
          <div
            onClick={toggleStatus}
            className="relative cursor-pointer group shrink-0"
            title="Click to toggle studio recording status"
          >
            <div
              className={`absolute -inset-1 rounded-full blur-sm transition-all ${
                liveStatus === "recording"
                  ? "bg-rose-500/60 animate-pulse"
                  : liveStatus === "live"
                  ? "bg-emerald-500/60 animate-pulse"
                  : "bg-stone-500/30"
              }`}
            />
            <img
              src={profile.avatar}
              alt={profile.name}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-brand-accent shadow-xl bg-obsidian"
            />
            <span
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shadow-lg whitespace-nowrap ${
                liveStatus === "recording"
                  ? "bg-rose-600 text-white animate-bounce"
                  : liveStatus === "live"
                  ? "bg-emerald-600 text-white animate-bounce"
                  : "bg-stone-700 text-stone-300"
              }`}
            >
              {liveStatus === "recording" ? "Live Masterclass" : liveStatus === "live" ? "Streaming Live" : "Studio Offline"}
            </span>
          </div>

          {/* Name & Title */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-brand-text">
                {profile.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold bg-brand-accent/15 border border-brand-accent/40 text-brand-accent flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                <span>{profile.role}</span>
              </span>
            </div>
            <span className="text-xs font-mono text-brand-secondary font-medium">
              {profile.handle}
            </span>
            <p className="text-xs sm:text-sm font-sans text-brand-secondary italic line-clamp-2 max-w-xl">
              "{profile.tagline}"
            </p>
          </div>
        </div>

        {/* Right: Studio Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="p-3.5 rounded-2xl bg-brand-accent/10 border border-brand-accent/30 text-xs font-sans space-y-1">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-brand-accent">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>ACTIVE STUDIO SESSION</span>
            </div>
            <p className="text-brand-text font-medium leading-snug">
              {profile.currentActivity}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-4 py-2.5 rounded-xl border border-brand-text/20 bg-brand-text/5 hover:bg-brand-text/10 text-brand-text font-sans text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Specialization Tags */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-brand-text/10">
        <span className="text-xs font-mono text-brand-secondary font-medium mr-1">Specializations:</span>
        {profile.specializations.map((spec) => (
          <span
            key={spec}
            className="px-3 py-1 rounded-xl text-xs font-sans font-medium bg-brand-text/5 border border-brand-text/15 text-brand-text"
          >
            {spec}
          </span>
        ))}
      </div>

      {/* Channel Stats Footer */}
      <div className="pt-4 border-t border-brand-text/10 flex flex-wrap items-center justify-between text-xs font-mono text-brand-secondary gap-4">
        <div className="flex items-center gap-6">
          <span>
            <strong className="text-brand-text text-sm font-bold">{profile.stats.studentsCount.toLocaleString()}</strong> Students Enrolled
          </span>
          <span>
            <strong className="text-brand-accent text-sm font-bold">{profile.stats.completionRate}%</strong> Completion Rate
          </span>
          <span>
            <strong className="text-amber-500 text-sm font-bold">★ {profile.stats.reviewRating}</strong> ({profile.stats.totalReviews.toLocaleString()} Reviews)
          </span>
        </div>

        <span className="text-[11px] text-brand-secondary italic">
          Featured XLChess Partner Studio
        </span>
      </div>

      {/* Share Toast Notification */}
      {sharedToast && (
        <div className="absolute top-4 right-4 z-50 px-4 py-2 rounded-xl bg-brand-accent text-obsidian font-sans text-xs font-bold shadow-xl flex items-center gap-1.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-obsidian" />
          <span>Channel Link Copied to Clipboard!</span>
        </div>
      )}
    </div>
  );
}
