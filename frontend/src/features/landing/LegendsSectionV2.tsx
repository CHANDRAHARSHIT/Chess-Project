/**
 * LegendsSectionV2.tsx
 * "Play Chess Legends" section — inspired by 3rd.html.
 *
 * Layout: text + quote LEFT | 3×3 coach image grid RIGHT
 *  (3rd.html had grid left, content right — we flip it)
 *
 * Coaches grid uses images from /coaches/bots (1).png … bots (9).png.
 * Auto-demo cycles through cards; hover pauses demo and shows card's quote.
 * Quotes provided by the user (Fischer, Morphy, Steinitz, Lasker, Capablanca + placeholders).
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router";

// ── Player data ──────────────────────────────────────────────────────────────
const PLAYERS = [
  {
    name: "Bobby Fischer",
    epithet: "The First U.S. World Chess Champion",
    quote: "h4, h5, sac, sac, mate.",
    img: "/assets/coaches/bots (1).png",
  },
  {
    name: "Paul Morphy",
    epithet: "The Greatest of All Time",
    quote: "We have to make Ben happy.",
    img: "/assets/coaches/bots (2).png",
  },
  {
    name: "Wilhelm Steinitz",
    epithet: "The First World Chess Champion",
    quote: "A sacrifice is best refuted by accepting it.",
    img: "/assets/coaches/bots (3).png",
  },
  {
    name: "Emanuel Lasker",
    epithet: "The Longest-Reigning World Chess Champion",
    quote: "The hardest game to win is a won game.",
    img: "/assets/coaches/bots (4).png",
  },
  {
    name: "José Raúl Capablanca",
    epithet: "The Chess Machine",
    quote: "I see only one move ahead, but it is always the correct one.",
    img: "/assets/coaches/bots (5).png",
  },
  {
    name: "Alexander Alekhine",
    epithet: "The Master of Complications",
    quote:
      "I think that for the highest achievements one must have the greatest knowledge of theory.",
    img: "/assets/coaches/bots (6).png",
  },
  {
    name: "Mikhail Botvinnik",
    epithet: "The Patriarch of Soviet Chess",
    quote: "Chess cannot be taught. Chess can only be learned.",
    img: "/assets/coaches/bots (7).png",
  },
  {
    name: "Mikhail Tal",
    epithet: "The Magician from Riga",
    quote:
      "You must take your opponent into a deep dark forest where two plus two equals five.",
    img: "/assets/coaches/bots (8).png",
  },
  {
    name: "Anatoly Karpov",
    epithet: "The Iron Tiger",
    quote: "Chess is everything: art, science, and sport.",
    img: "/assets/coaches/bots (9).png",
  },
] as const;

export default function LegendsSectionV2() {
  const sectionRef = useRef<HTMLElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isChanging, setIsChanging] = useState(false);

  const activeIndexRef = useRef(0);
  const demoRunningRef = useRef(true);
  const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Smooth copy transition ───────────────────────────────────────────────
  const updateCopy = useCallback((index: number) => {
    setIsChanging(true);
    setTimeout(() => {
      setActiveIndex(index);
      setIsChanging(false);
    }, 120);
  }, []);

  // ── Activate a card ──────────────────────────────────────────────────────
  const activateCard = useCallback(
    (index: number) => {
      activeIndexRef.current = index;
      updateCopy(index);
    },
    [updateCopy],
  );

  // ── Start / pause demo ────────────────────────────────────────────────────
  const startDemo = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    demoRunningRef.current = true;
    if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    activateCard(activeIndexRef.current);
    demoTimerRef.current = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % PLAYERS.length;
      activateCard(nextIndex);
    }, 1600);
  }, [activateCard]);

  const pauseDemo = useCallback(() => {
    demoRunningRef.current = false;
    if (demoTimerRef.current) clearInterval(demoTimerRef.current);
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      startDemo();
    }, 1000);
  }, [startDemo]);

  useEffect(() => {
    startDemo();
    return () => {
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [startDemo]);

  const activePlayer = PLAYERS[activeIndex];

  return (
    <section
      ref={sectionRef}
      className="v2-legends-section py-16 md:py-22 relative overflow-hidden"
      id="legends-v2-section"
      aria-label="Play Chess Legends section"
    >
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(360px,0.78fr)_minmax(600px,1.55fr)] items-center gap-10 lg:gap-16">
          {/* ── Left: Text content + rotating quote ── */}
          <div className="v2-content max-w-[570px] text-left lg:text-left justify-self-center lg:justify-self-start">
            <h2 className="v2-h1">Play Chess Legends</h2>

            {/* Dynamic copy — reacts to active legend */}
            <div
              aria-live="polite"
              style={{
                minHeight: "200px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                opacity: isChanging ? 0 : 1,
                transform: isChanging ? "translateY(5px)" : "translateY(0)",
                transition: "opacity 0.14s ease, transform 0.14s ease",
              }}
            >
              <h3 className="player-title">{activePlayer.name}</h3>
              <div className="player-epithet">{activePlayer.epithet}</div>
              <p className="quote">&ldquo;{activePlayer.quote}&rdquo;</p>
            </div>

            {/* CTA */}
            <Link
              id="legends-v2-challenge-btn"
              to="/play"
              className="v2-legends-cta legends-cta cta-shine"
            >
              Challenge a Legend
            </Link>
          </div>

          {/* ── Right: 3×3 coach image grid ── */}
          <div className="relative">
            <div
              id="legends-v2-grid"
              className="v2-bot-grid bot-grid"
              onMouseLeave={() => {
                pauseDemo();
                scheduleResume();
              }}
            >
              {PLAYERS.map((player, index) => (
                <LegendCard
                  key={player.name}
                  player={player}
                  index={index}
                  isActive={activeIndex === index}
                  onHover={(idx) => {
                    pauseDemo();
                    if (resumeTimerRef.current)
                      clearTimeout(resumeTimerRef.current);
                    activateCard(idx);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── LegendCard sub-component ─────────────────────────────────────────────────
type PlayerData = (typeof PLAYERS)[number];

function LegendCard({
  player,
  index,
  isActive,
  onHover,
}: {
  player: PlayerData;
  index: number;
  isActive: boolean;
  onHover: (idx: number) => void;
}) {
  return (
    <button
      type="button"
      className={`v2-bot-card bot-card legend-card ${isActive ? "demo-active" : ""}`}
      aria-label={player.name}
      data-index={index}
      onMouseEnter={() => onHover(index)}
      onFocus={() => onHover(index)}
    >
      <img
        src={player.img}
        alt={player.name}
        className="absolute object-cover pointer-events-none"
        style={{
          width: "120%",
          height: "100%",
          top: "0%",
          left: "-10%",
          maxWidth: "none",
        }}
        loading="lazy"
      />
    </button>
  );
}
