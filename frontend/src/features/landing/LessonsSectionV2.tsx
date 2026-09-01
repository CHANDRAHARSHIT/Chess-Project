/**
 * LessonsSectionV2.tsx
 * "Level Up with Lessons" section — inspired by 2nd.html.
 *
 * Layout: text column left | 3×2 tile grid right.
 * Tiles display images from /2x3/tile-1.png … /2x3/tile-6.png.
 * Each tile has a vibrant colored background + hover glow matching 2nd.html.
 * "Explore" button navigates to /lessons.
 */

import { useRef } from "react";
import { Link } from "react-router";

// Tile colour palette matching 2nd.html stone colours
const TILES = [
  {
    id: 1,
    img: "/assets/2x3/tile-1.png",
    label: "Openings",
    bg: "linear-gradient(145deg, #e8f8ea, #d7f1db)",
    shadow: "0 7px 0 #bed8c2",
    hoverBg: "linear-gradient(145deg, #baffc1, #7df88a)",
    hoverShadow:
      "0 7px 0 #2d8d38, 0 0 22px rgba(76,224,91,.68), 0 0 55px rgba(76,224,91,.34)",
  },
  {
    id: 2,
    img: "/assets/2x3/tile-2.png",
    label: "Tactics",
    bg: "linear-gradient(145deg, #fdeaea, #f8d9d9)",
    shadow: "0 7px 0 #dfbebe",
    hoverBg: "linear-gradient(145deg, #ffc1c1, #ff8585)",
    hoverShadow:
      "0 7px 0 #b52e2e, 0 0 22px rgba(255,75,75,.68), 0 0 55px rgba(255,75,75,.34)",
  },
  {
    id: 3,
    img: "/assets/2x3/tile-3.png",
    label: "Endgames",
    bg: "linear-gradient(145deg, #e9f3ff, #d8eaff)",
    shadow: "0 7px 0 #bed0e7",
    hoverBg: "linear-gradient(145deg, #c6e0ff, #8fc4ff)",
    hoverShadow:
      "0 7px 0 #2862b5, 0 0 22px rgba(66,142,255,.68), 0 0 55px rgba(66,142,255,.34)",
  },
  {
    id: 4,
    img: "/assets/2x3/tile-4.png",
    label: "Strategy",
    bg: "linear-gradient(145deg, #fff7d8, #f9edbc)",
    shadow: "0 7px 0 #ded3a6",
    hoverBg: "linear-gradient(145deg, #fff2a8, #ffd85a)",
    hoverShadow:
      "0 7px 0 #bd7b1e, 0 0 22px rgba(255,196,54,.7), 0 0 55px rgba(255,196,54,.36)",
  },
  {
    id: 5,
    img: "/assets/2x3/tile-5.png",
    label: "Middlegame",
    bg: "linear-gradient(145deg, #f1eafd, #e4d9f8)",
    shadow: "0 7px 0 #cbbde1",
    hoverBg: "linear-gradient(145deg, #dcc3ff, #b991f6)",
    hoverShadow:
      "0 7px 0 #8060b4, 0 0 22px rgba(161,111,232,.68), 0 0 55px rgba(161,111,232,.34)",
  },
  {
    id: 6,
    img: "/assets/2x3/tile-6.png",
    label: "Calculation",
    bg: "linear-gradient(145deg, #fff0e2, #f9dfc8)",
    shadow: "0 7px 0 #dfc3a8",
    hoverBg: "linear-gradient(145deg, #ffd2a8, #ffad68)",
    hoverShadow:
      "0 7px 0 #c97d3a, 0 0 22px rgba(255,153,72,.68), 0 0 55px rgba(255,153,72,.34)",
  },
] as const;

export default function LessonsSectionV2() {
  const sectionRef = useRef<HTMLElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  let hintDismissed = false;

  const dismissHint = () => {
    if (hintDismissed || !hintRef.current) return;
    hintDismissed = true;
    hintRef.current.style.opacity = "0";
    hintRef.current.style.transform = "translateY(4px)";
    hintRef.current.style.pointerEvents = "none";
  };

  return (
    <section
      ref={sectionRef}
      className="v2-lessons-section py-16 md:py-22 relative overflow-hidden"
      id="lessons-v2-section"
      aria-label="Lessons section"
    >
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(340px,0.75fr)_minmax(600px,1.55fr)] items-center gap-10 lg:gap-16">
          {/* ── Left: Text content ── */}
          <div className="v2-content max-w-[560px] text-left justify-self-center lg:justify-self-start">
            <h2 className="v2-h1">Level Up with Lessons</h2>

            <p className="v2-subtitle">
              Build your skills with quick lessons for every level.
            </p>

            {/* Explore button → /lessons */}
            <Link
              to="/lessons"
              id="lessons-v2-explore-btn"
              className="v2-lesson-button lesson-button cta-shine"
            >
              Explore
            </Link>
          </div>

          {/* ── Right: 3×2 tile grid ── */}
          <div className="flex flex-col items-center gap-2.5 w-full">
            <div
              className="v2-stone-path stone-path"
              aria-label="Lesson tiles"
            >
              {TILES.map((tile) => (
                <LessonTile
                  key={tile.id}
                  tile={tile}
                  onFirstHover={dismissHint}
                />
              ))}
            </div>

            {/* Hover hint */}
            <div ref={hintRef} className="v2-hint hint">
              Hover over a lesson tile
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── LessonTile sub-component ─────────────────────────────────────────────────
type TileData = (typeof TILES)[number];

function LessonTile({
  tile,
  onFirstHover,
}: {
  tile: TileData;
  onFirstHover: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={tile.label}
      className={`v2-stone v2-stone-${tile.id} stone stone-${tile.id} lesson-tile`}
      onMouseEnter={onFirstHover}
      onFocus={onFirstHover}
    >
      <img
        src={tile.img}
        alt={tile.label}
        className="w-[70%] h-[70%] object-contain pointer-events-none transition-transform duration-200"
        loading="lazy"
      />
    </button>
  );
}
