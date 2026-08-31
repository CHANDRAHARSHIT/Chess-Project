/**
 * LessonsSectionV2.tsx
 * "Level Up with Lessons" section — inspired by 2nd.html.
 *
 * Layout: text column left | 3×2 tile grid right.
 * Tiles display images from /2x3/tile-1.png … /2x3/tile-6.png.
 * Each tile has a vibrant colored background + hover glow matching 2nd.html.
 * "Explore" button navigates to /lessons.
 */

import { useRef, useState } from "react";
import { useScrollReveal } from "@/shared/hooks/useScrollReveal";
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
  const contentRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  let hintDismissed = false;

  useScrollReveal(contentRef as React.RefObject<Element>, {
    y: 50,
    duration: 0.9,
    stagger: 0,
  });
  useScrollReveal(gridRef as React.RefObject<Element>, {
    selector: ".lesson-tile",
    y: 40,
    stagger: 0.07,
    duration: 0.8,
    start: "top 85%",
  });

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
      className="relative py-16 md:py-22 overflow-hidden"
      id="lessons-v2-section"
      aria-label="Lessons section"
    >
      {/* Subtle background separator */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "var(--obsidian)" }}
        aria-hidden="true"
      />

      <div className="max-w-[1275px] mx-auto px-2 sm:px-6 lg:px-8 relative z-10">
        {/*
          Grid: content left (~0.75fr) | tile grid right (~1.55fr)
          Mobile: stacked (content first → grid)
        */}
        <div className="grid grid-cols-1 lg:grid-cols-[0.75fr_1.55fr] items-center gap-10 lg:gap-16">
          {/* ── Left: Text content ─────────────────────────────────────── */}
          <div
            ref={contentRef}
            className="max-w-[460px] text-left"
            style={{ opacity: 0 }}
          >
            <h2
              className="font-display"
              style={{
                fontSize: "clamp(32px, 3vw, 49px)",
                lineHeight: 1.02,
                letterSpacing: "-0.035em",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              Level Up with Lessons
            </h2>

            <p
              className="font-sans leading-relaxed"
              style={{
                fontSize: "clamp(15px, 1.25vw, 20px)",
                color: "var(--text-secondary)",
                maxWidth: 408,
                marginBottom: "30px",
                lineHeight: 1.45,
              }}
            >
              Build your skills with quick lessons for every level.
            </p>

            {/* Explore button → /lessons */}
            <Link
              to="/lessons"
              id="lessons-v2-explore-btn"
              className="inline-flex items-center justify-center font-sans font-bold rounded-[12px] cta-shine"
              style={{
                width: "min(100%, 320px)",
                minHeight: "61px",
                fontSize: "clamp(18px, 1.5vw, 24px)",
                border: "1px solid var(--marble-border)",
                background:
                  "linear-gradient(135deg, rgba(212,175,110,0.10) 0%, rgba(212,175,110,0.04) 100%)",
                color: "var(--gold-bright)",
                transition:
                  "transform 0.15s ease, background 0.15s ease, border-color 0.15s ease",
                display: "inline-flex",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--marble-border-strong)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--marble-border)";
              }}
            >
              Explore
            </Link>
          </div>

          {/* ── Right: 3×2 tile grid ──────────────────────────────────── */}
          <div className="flex flex-col items-center gap-2.5">
            <div
              ref={gridRef}
              className="w-full"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gridTemplateRows: "repeat(2, minmax(0, 1fr))",
                gap: "clamp(12px, 1.4vw, 18px)",
                aspectRatio: "4/3",
              }}
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

            {/* Hover hint — mirrors 2nd.html */}
            <div
              ref={hintRef}
              className="font-sans text-xs font-bold text-center"
              style={{
                color: "var(--text-secondary)",
                marginTop: "4px",
                transition: "opacity 0.25s ease, transform 0.25s ease",
                animation: "v2-hint-blink 1.35s ease-in-out infinite",
              }}
            >
              Hover over a lesson tile
            </div>
          </div>
        </div>
      </div>

      {/* Inline keyframe for hint blink */}
      <style>{`
        @keyframes v2-hint-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
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
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      aria-label={tile.label}
      className="lesson-tile relative overflow-hidden cursor-pointer border border-transparent focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 flex items-center justify-center"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "10px",
        background: hovered ? tile.hoverBg : tile.bg,
        boxShadow: hovered ? tile.hoverShadow : tile.shadow,
        transition:
          "background 0.2s ease, box-shadow 0.24s ease, transform 0.2s ease",
        transform: hovered ? "translateY(-3px) scale(1.025)" : "none",
        padding: 0,
      }}
      onMouseEnter={() => {
        setHovered(true);
        onFirstHover();
      }}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => {
        setHovered(true);
        onFirstHover();
      }}
      onBlur={() => setHovered(false)}
    >
      <img
        src={tile.img}
        alt={tile.label}
        className="w-[70%] h-[70%] object-contain pointer-events-none"
        style={{
          opacity: hovered ? 1 : 0.9,
          transition: "opacity 0.2s ease, transform 0.2s ease",
          transform: hovered ? "scale(1.05)" : "scale(1)",
        }}
        loading="lazy"
      />
    </button>
  );
}
