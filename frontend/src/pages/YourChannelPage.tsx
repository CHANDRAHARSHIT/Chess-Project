/**
 * YourChannelPage.tsx
 *
 * Full Showcase Page for /channel and /your-channel routes.
 * Persona: Alex Vance — Chess Educator & Content Creator.
 */

import { useState } from "react";
import { ChannelHero } from "../components/creator/ChannelHero";
import { RepertoireCard } from "../components/creator/RepertoireCard";
import { ExplodedLessonShowcase } from "../components/creator/ExplodedLessonShowcase";
import { MasterclassCard } from "../components/creator/MasterclassCard";
import { StudentBreakthroughs } from "../components/creator/StudentBreakthroughs";
import { SynchronizedStudyModal } from "../components/creator/SynchronizedStudyModal";
import {
  CREATOR_PROFILE,
  SIGNATURE_REPERTOIRES,
  MASTERCLASSES,
  STUDENT_BREAKTHROUGHS,
  type MasterclassItem,
} from "../data/creatorMockData";

export default function YourChannelPage() {
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<MasterclassItem | null>(null);

  const primaryRepertoire = SIGNATURE_REPERTOIRES[0]; // Catalan Defense

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-brand-bg text-brand-text py-6 sm:py-8 md:py-10 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto space-y-8 sm:space-y-10 md:space-y-12 animate-fadeIn overflow-x-hidden">
      {/* Section 1: Hero Header */}
      <ChannelHero profile={CREATOR_PROFILE} />

      {/* Section 2: Pinned Creator Pick Signature Repertoire */}
      <RepertoireCard repertoire={primaryRepertoire} isPinned={true} />

      {/* Section 3: Flagship 'Inside a Lesson' Exploded Product View */}
      <ExplodedLessonShowcase />

      {/* Section 4: Featured Interactive Masterclasses */}
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
              onPreviewClick={(selected) => setSelectedPreviewItem(selected)}
            />
          ))}
        </div>
      </div>

      {/* Section 5: Student Breakthrough Stories */}
      <StudentBreakthroughs breakthroughs={STUDENT_BREAKTHROUGHS} />

      {/* Hero Synchronized Study Modal Preview */}
      <SynchronizedStudyModal
        item={selectedPreviewItem}
        onClose={() => setSelectedPreviewItem(null)}
      />
    </div>
  );
}
