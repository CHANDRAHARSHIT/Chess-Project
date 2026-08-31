/**
 * HomeV2Page.tsx
 * Revamped home page — accessible at /home-v2.
 * Keeps the same color tokens / theme awareness as the rest of the app.
 *
 * Sections:
 *  1. Hero V2   — video-left / content-right layout (new-hero.html inspiration)
 *  2. Lessons   — 6-tile colorful grid (2nd.html inspiration)
 *  3. Legends   — 9-tile coach grid with rotating quotes (3rd.html inspiration, text LEFT / grid RIGHT)
 */

import HeroV2 from "@/features/landing/HeroV2";
import LessonsSectionV2 from "@/features/landing/LessonsSectionV2";
import LegendsSectionV2 from "@/features/landing/LegendsSectionV2";
import PuzzleSectionV2 from "@/features/landing/PuzzleSectionV2";

export default function HomeV2Page() {
  return (
    <div className="min-h-screen text-brand-text flex flex-col">
      <main className="flex-1">
        <HeroV2 />
        <LessonsSectionV2 />
        <LegendsSectionV2 />
        <PuzzleSectionV2 />
      </main>
    </div>
  );
}
