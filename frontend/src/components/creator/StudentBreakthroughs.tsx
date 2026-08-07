/**
 * StudentBreakthroughs.tsx
 *
 * Student Success Stories & Real Human Testimonials.
 * Demonstrates authentic human stories of students mastering openings on XLChess.
 * Fully theme-aware for light and dark modes.
 */

import { ThemedChessboard } from "../ThemedChessboard";
import type { StudentBreakthrough } from "../../data/creatorMockData";

interface StudentBreakthroughsProps {
  breakthroughs: StudentBreakthrough[];
}

export function StudentBreakthroughs({ breakthroughs }: StudentBreakthroughsProps) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl sm:text-2xl font-display font-bold text-brand-text">
            Student Success Stories
          </h3>
          <p className="text-xs sm:text-sm font-sans text-brand-secondary mt-0.5">
            Real human reactions from chess players studying these interactive masterclasses
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {breakthroughs.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl border border-brand-text/15 bg-brand-surface p-5 flex flex-col justify-between space-y-4 transition-all duration-300 hover:border-brand-accent/40 hover:-translate-y-1"
          >
            <div className="space-y-3">
              {/* Header: Student Avatar & Headline */}
              <div className="flex items-center gap-3">
                <img
                  src={item.studentAvatar}
                  alt={item.studentName}
                  className="w-10 h-10 rounded-full object-cover border border-brand-accent/40 bg-obsidian"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-sans font-semibold text-brand-text">
                    {item.studentName}
                  </span>
                  <span className="text-[11px] font-mono text-brand-accent font-semibold">
                    {item.openingLearned}
                  </span>
                </div>
              </div>

              {/* Bold Student Headline */}
              <h4 className="text-sm font-display font-bold text-brand-text leading-snug">
                "{item.headline}"
              </h4>

              {/* Board FEN Snapshot */}
              <div className="relative w-full aspect-square max-w-[160px] mx-auto rounded-xl overflow-hidden border border-brand-text/20 bg-obsidian">
                <ThemedChessboard
                  options={{
                    position: item.fenSnapshot,
                    boardOrientation: "white",
                    showNotation: false,
                    allowDragging: false,
                  }}
                />
              </div>

              {/* Testimonial Quote */}
              <p className="text-xs font-sans text-brand-secondary italic leading-relaxed">
                "{item.testimonial}"
              </p>
            </div>

            <div className="pt-3 border-t border-brand-text/10 text-[10px] font-mono text-brand-secondary text-right">
              {item.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

