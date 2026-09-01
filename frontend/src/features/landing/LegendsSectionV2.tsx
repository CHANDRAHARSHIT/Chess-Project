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
    img: "/assets/coaches/bots 1.png",
  },
  {
    name: "Paul Morphy",
    epithet: "The Greatest of All Time",
    quote: "We have to make Ben happy.",
    img: "/assets/coaches/bots 2.png",
  },
  {
    name: "Wilhelm Steinitz",
    epithet: "The First World Chess Champion",
    quote: "A sacrifice is best refuted by accepting it.",
    img: "/assets/coaches/bots 3.png",
  },
  {
    name: "Emanuel Lasker",
    epithet: "The Longest-Reigning World Chess Champion",
    quote: "The hardest game to win is a won game.",
    img: "/assets/coaches/bots 4.png",
  },
  {
    name: "José Raúl Capablanca",
    epithet: "The Chess Machine",
    quote: "I see only one move ahead, but it is always the correct one.",
    img: "/assets/coaches/bots 5.png",
  },
  {
    name: "Alexander Alekhine",
    epithet: "The Master of Complications",
    quote:
      "I think that for the highest achievements one must have the greatest knowledge of theory.",
    img: "/assets/coaches/bots 6.png",
  },
  {
    name: "Mikhail Botvinnik",
    epithet: "The Patriarch of Soviet Chess",
    quote: "Chess cannot be taught. Chess can only be learned.",
    img: "/assets/coaches/bots 7.png",
  },
  {
    name: "Mikhail Tal",
    epithet: "The Magician from Riga",
    quote:
      "You must take your opponent into a deep dark forest where two plus two equals five.",
    img: "/assets/coaches/bots 8.png",
  },
  {
    name: "Anatoly Karpov",
    epithet: "The Iron Tiger",
    quote: "Chess is everything: art, science, and sport.",
    img: "/assets/coaches/bots 9.png",
  },
] as const;

export default function LegendsSectionV2() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridWrapRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isChanging, setIsChanging] = useState(false);
  const [isDemoActive, setIsDemoActive] = useState(true);

  const activeIndexRef = useRef(0);
  const demoRunningRef = useRef(true);
  const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Smooth copy transition matching HTML 110ms timer ───────────────────────
  const updateCopy = useCallback((index: number) => {
    if (changeTimerRef.current) clearTimeout(changeTimerRef.current);
    setIsChanging(true);
    changeTimerRef.current = setTimeout(() => {
      setActiveIndex(index);
      setIsChanging(false);
    }, 110);
  }, []);

  // ── Activate a card + move cursor demo ────────────────────────────────────
  const activateCard = useCallback(
    (index: number) => {
      activeIndexRef.current = index;
      setIsDemoActive(true);
      updateCopy(index);

      if (gridWrapRef.current && cursorRef.current) {
        const card = gridWrapRef.current.querySelector<HTMLElement>(
          `[data-index="${index}"]`,
        );
        if (card) {
          const wrap = gridWrapRef.current.getBoundingClientRect();
          const rect = card.getBoundingClientRect();
          cursorRef.current.style.left = `${rect.left - wrap.left + rect.width * 0.64}px`;
          cursorRef.current.style.top = `${rect.top - wrap.top + rect.height * 0.54}px`;
          cursorRef.current.classList.add("show");
        }
      }
    },
    [updateCopy],
  );

  // ── Start / pause demo (1450ms cycle) ─────────────────────────────────────
  const startDemo = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    demoRunningRef.current = true;
    if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    activateCard(activeIndexRef.current);
    demoTimerRef.current = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % PLAYERS.length;
      activateCard(nextIndex);
    }, 1450);
  }, [activateCard]);

  const pauseDemo = useCallback(() => {
    demoRunningRef.current = false;
    if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    if (cursorRef.current) cursorRef.current.classList.remove("show");
    setIsDemoActive(false);
  }, []);

  useEffect(() => {
    startDemo();
    const onResize = () => {
      if (demoRunningRef.current) activateCard(activeIndexRef.current);
    };
    window.addEventListener("resize", onResize);
    return () => {
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      if (changeTimerRef.current) clearTimeout(changeTimerRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [startDemo, activateCard]);

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
            <h2 className="v2-h1 text-center">Play Chess Legends</h2>

            {/* Dynamic copy — reacts to active legend */}
            <div
              aria-live="polite"
              style={{
                minHeight: "200px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
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

          {/* ── Right: 3×3 coach image grid with simulated cursor ── */}
          <div ref={gridWrapRef} className="grid-wrap v2-grid-wrap relative">
            <div
              id="legends-v2-grid"
              className="v2-bot-grid bot-grid"
              onMouseLeave={() => {
                if (resumeTimerRef.current)
                  clearTimeout(resumeTimerRef.current);
                resumeTimerRef.current = setTimeout(() => {
                  activeIndexRef.current = 0;
                  startDemo();
                }, 900);
              }}
            >
              {PLAYERS.map((player, index) => (
                <LegendCard
                  key={player.name}
                  player={player}
                  index={index}
                  isActive={activeIndex === index}
                  isDemoActive={isDemoActive}
                  onHover={(idx) => {
                    pauseDemo();
                    if (resumeTimerRef.current)
                      clearTimeout(resumeTimerRef.current);
                    activeIndexRef.current = idx;
                    setActiveIndex(idx);
                    updateCopy(idx);
                  }}
                />
              ))}
            </div>

            {/* Cursor Demo SVG matching chess_legends_animated_banner.html */}
            <div
              ref={cursorRef}
              className="cursor-demo v2-cursor-demo"
              id="cursorDemo"
              aria-hidden="true"
            >
              <svg viewBox="0 0 48 48">
                <path
                  d="M9 4l26 22-12 2 6 12-6 3-6-13-8 9z"
                  fill="#fff"
                  stroke="#222"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </svg>
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
  isDemoActive,
  onHover,
}: {
  player: PlayerData;
  index: number;
  isActive: boolean;
  isDemoActive: boolean;
  onHover: (idx: number) => void;
}) {
  return (
    <button
      type="button"
      className={`v2-bot-card bot-card legend-card ${isDemoActive && isActive ? "demo-active" : ""}`}
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
          width: "100%",
          height: "100%",
          top: "0%",
          maxWidth: "none",
        }}
        loading="lazy"
      />
    </button>
  );
}
