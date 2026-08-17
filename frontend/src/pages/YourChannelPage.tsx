/**
 * YourChannelPage.tsx
 *
 * Full Showcase Page for /channel and /your-channel routes.
 */

import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { ChannelHero } from "@/features/creator/ChannelHero";
import { MasterclassCard } from "@/features/creator/MasterclassCard";
import { StudentBreakthroughs } from "@/features/creator/StudentBreakthroughs";
import {
  CREATOR_PROFILE,
  MASTERCLASSES,
  STUDENT_BREAKTHROUGHS,
} from "@/features/creator/creatorMockData";
import { soundManager } from "@/shared/lib/SoundManager";

export default function YourChannelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-brand-bg text-brand-text py-6 sm:py-8 md:py-10 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto space-y-6 sm:space-y-8 animate-fadeIn overflow-x-hidden">
      {/* Back Navigation */}
      <div>
        <button
          type="button"
          onClick={() => {
            soundManager.playButtonClick();
            navigate("/");
          }}
          className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-colors duration-200 font-sans text-sm font-semibold cursor-pointer group"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Section 1: Hero Header */}
      <ChannelHero profile={CREATOR_PROFILE} />

      {/* Section 2: Featured Interactive Masterclasses */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-brand-text">
              Featured Interactive Masterclasses
            </h3>
            <p className="text-xs sm:text-sm font-sans text-stone-400 mt-0.5">
              Video lessons with synchronized PGN move trees and position retention markers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MASTERCLASSES.slice(0, 3).map((item) => (
            <MasterclassCard
              key={item.id}
              item={item}
            />
          ))}
        </div>
      </div>

      {/* Section 3: Student Breakthrough Stories */}
      <StudentBreakthroughs breakthroughs={STUDENT_BREAKTHROUGHS} />
    </div>
  );
}

