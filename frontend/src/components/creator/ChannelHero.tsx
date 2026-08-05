/**
 * ChannelHero.tsx
 *
 * Hero banner component for Alex Vance's Channel Homepage.
 * Features:
 * - Dynamic live status toggle (Recording / Live Masterclass / Offline)
 * - Animated avatar status ring
 * - Creator tagline & specializations
 * - Tactile action triggers with sound feedback
 */

import { useState } from "react";
import { Radio, Video, Share2, Sparkles, Award, CheckCircle2 } from "lucide-react";
import { soundManager } from "../../utils/SoundManager";
import type { CreatorProfile } from "../../data/creatorMockData";

interface ChannelHeroProps {
  profile: CreatorProfile;
}

export function ChannelHero({ profile }: ChannelHeroProps) {
  const [liveStatus, setLiveStatus] = useState<"recording" | "live" | "offline">(profile.liveStatus);
  const [copied, setCopied] = useState(false);

  const toggleStatus = () => {
    soundManager.playButtonClick();
    if (liveStatus === "recording") setLiveStatus("live");
    else if (liveStatus === "live") setLiveStatus("offline");
    else setLiveStatus("recording");
  };

  const handleShare = () => {
    soundManager.playButtonClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-brand-border/30 bg-obsidian-mid shadow-2xl transition-all duration-300">
      {/* Background Banner with Obsidian & Gold Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-950/40 via-obsidian-mid to-obsidian opacity-90" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(212,175,110,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(212,175,110,0.03)_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

      <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: Avatar & Identity Details */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar Container with Animated Live Status Ring */}
          <div className="relative group shrink-0">
            <div className={`absolute -inset-1 rounded-full blur-sm transition-all duration-500 ${
              liveStatus === "live"
                ? "bg-rose-500/80 animate-pulse"
                : liveStatus === "recording"
                ? "bg-brand-accent/60"
                : "bg-brand-border/30"
            }`} />
            
            <img
              src={profile.avatar}
              alt={profile.name}
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-brand-accent/50 shadow-xl bg-obsidian"
            />

            {/* Status Pill Badge on Avatar */}
            <button
              onClick={toggleStatus}
              title="Click to toggle live demo status"
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase flex items-center gap-1.5 shadow-lg border backdrop-blur-md cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${
                liveStatus === "live"
                  ? "bg-rose-500/90 text-white border-rose-400"
                  : liveStatus === "recording"
                  ? "bg-amber-500/90 text-obsidian font-bold border-amber-300"
                  : "bg-slate-800/90 text-slate-300 border-slate-600"
              }`}
            >
              {liveStatus === "live" && <Radio className="w-3 h-3 animate-ping text-white" />}
              {liveStatus === "recording" && <Video className="w-3 h-3 text-obsidian animate-bounce" />}
              <span>{liveStatus === "live" ? "Live Masterclass" : liveStatus === "recording" ? "Recording" : "Offline"}</span>
            </button>
          </div>

          {/* Identity Info */}
          <div className="flex flex-col space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-brand-text tracking-wide">
                {profile.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans font-semibold bg-brand-accent/10 border border-brand-accent/30 text-brand-accent">
                <Award className="w-3.5 h-3.5" />
                <span>{profile.role}</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm font-mono text-brand-secondary">
              {profile.handle}
            </p>

            <p className="text-sm text-brand-text/80 max-w-xl italic font-serif leading-relaxed">
              "{profile.tagline}"
            </p>

            {/* Specialization Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {profile.specializations.map((spec) => (
                <span
                  key={spec}
                  className="px-2.5 py-1 rounded-md text-[11px] font-sans bg-brand-text/5 border border-brand-text/10 text-brand-secondary hover:text-brand-text hover:border-brand-accent/30 transition-colors"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Creator Activity & Quick Actions */}
        <div className="flex flex-col items-start md:items-end space-y-4 w-full md:w-auto border-t md:border-t-0 border-brand-text/10 pt-4 md:pt-0">
          {/* Current Live Activity Card */}
          <div className="w-full md:w-64 p-3 rounded-2xl bg-obsidian-glass border border-brand-accent/20 backdrop-blur-md shadow-inner flex flex-col space-y-1">
            <span className="text-[10px] font-mono text-brand-accent uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Active Studio Session</span>
            </span>
            <p className="text-xs text-brand-text font-sans font-medium line-clamp-2">
              {profile.currentActivity}
            </p>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={toggleStatus}
              className="flex-1 md:flex-initial btn-gold flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold shadow-lg hover:shadow-brand-accent/20 transition-all duration-200 cursor-pointer active:scale-95"
            >
              <Radio className="w-4 h-4" />
              <span>{liveStatus === "live" ? "Streaming Now" : "Go Live Preview"}</span>
            </button>

            <button
              onClick={handleShare}
              className="px-3.5 py-2.5 rounded-xl border border-brand-border/40 text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 transition-all duration-200 flex items-center gap-2 text-xs font-sans cursor-pointer active:scale-95"
              title="Share Channel Link"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Reach Indicator Strip */}
      <div className="relative z-10 px-6 py-3 bg-obsidian-light/80 border-t border-brand-text/10 flex flex-wrap items-center justify-between gap-4 text-xs font-sans text-brand-secondary">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-brand-text font-mono font-bold text-sm">14.25K</span>
            <span className="ml-1.5 text-brand-secondary">Students Enrolled</span>
          </div>
          <div className="hidden sm:block text-brand-text/20">•</div>
          <div>
            <span className="text-brand-accent font-mono font-bold text-sm">94.8%</span>
            <span className="ml-1.5 text-brand-secondary">Completion Rate</span>
          </div>
          <div className="hidden sm:block text-brand-text/20">•</div>
          <div className="flex items-center gap-1">
            <span className="text-amber-400 font-mono font-bold text-sm">★ 4.98</span>
            <span className="text-brand-secondary">(1,240 Reviews)</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-brand-accent/80 italic">
          Featured XLChess Partner Studio
        </div>
      </div>
    </div>
  );
}
