/**
 * ChannelHero.tsx
 *
 * Hero Header Banner for Channel Showcase (/channel).
 * Uses authenticated user DP and name with "Coming Soon" indicator.
 */

import { Award, Users, CheckCircle2, Star, BookOpen } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import type { CreatorProfile } from "@/data/creatorMockData";

interface ChannelHeroProps {
  profile: CreatorProfile;
}

export function ChannelHero({ profile }: ChannelHeroProps) {
  const { session } = useSession();

  const userDp = session?.user?.image || profile.avatar;
  const userRawName = session?.user?.name || profile.name;
  const userName = `${userRawName} (Coming Soon)`;
  const userHandle = session?.user?.name
    ? `@${session.user.name.toLowerCase().replace(/\s+/g, "")}`
    : profile.handle;

  return (
    <div className="relative w-full rounded-3xl border border-brand-accent/30 bg-brand-surface p-6 sm:p-8 space-y-6 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Top Header Grid */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        {/* Left: Avatar & Identity */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 max-w-2xl">
          <div className="relative shrink-0">
            <img
              src={userDp}
              alt={userName}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-brand-accent bg-obsidian"
            />
          </div>

          {/* Name & Title */}
          <div className="flex flex-col space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-brand-text">
                {userName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold bg-brand-accent/15 border border-brand-accent/40 text-brand-accent flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                <span>{profile.role}</span>
              </span>
            </div>
            <span className="text-xs font-mono text-brand-secondary font-medium">
              {userHandle}
            </span>
            <p className="text-xs sm:text-sm font-sans text-brand-secondary italic line-clamp-2 mt-1">
              "{profile.tagline}"
            </p>
          </div>
        </div>

        {/* Right: Glass Stat Metrics Grid filling the right side */}
        <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0">
          <div className="relative overflow-hidden rounded-2xl p-px">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-accent/30 via-white/10 to-transparent pointer-events-none" />
            <div className="relative rounded-[calc(1rem-1px)] bg-white/[0.05] backdrop-blur-md p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-brand-accent">
                <Users className="w-4 h-4" />
                <span className="text-[11px] font-sans font-medium text-brand-secondary">Students</span>
              </div>
              <p className="text-lg font-mono font-bold text-brand-text">
                {profile.stats.studentsCount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl p-px">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/30 via-white/10 to-transparent pointer-events-none" />
            <div className="relative rounded-[calc(1rem-1px)] bg-white/[0.05] backdrop-blur-md p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[11px] font-sans font-medium text-brand-secondary">Completion</span>
              </div>
              <p className="text-lg font-mono font-bold text-brand-accent">
                {profile.stats.completionRate}%
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl p-px">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/30 via-white/10 to-transparent pointer-events-none" />
            <div className="relative rounded-[calc(1rem-1px)] bg-white/[0.05] backdrop-blur-md p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="text-[11px] font-sans font-medium text-brand-secondary">Rating</span>
              </div>
              <p className="text-lg font-mono font-bold text-brand-text">
                {profile.stats.reviewRating} <span className="text-xs text-brand-secondary font-normal">({profile.stats.totalReviews})</span>
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl p-px">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/30 via-white/10 to-transparent pointer-events-none" />
            <div className="relative rounded-[calc(1rem-1px)] bg-white/[0.05] backdrop-blur-md p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-indigo-400">
                <BookOpen className="w-4 h-4" />
                <span className="text-[11px] font-sans font-medium text-brand-secondary">Lessons</span>
              </div>
              <p className="text-lg font-mono font-bold text-brand-text">
                {profile.stats.lessonsPublished}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Specialization Tags & Partner Studio Footer */}
      <div className="pt-4 border-t border-brand-text/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
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

        <span className="text-[11px] font-mono text-brand-secondary italic">
          Featured XLChess Partner Studio
        </span>
      </div>
    </div>
  );
}


