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

import { useRef, useEffect, useCallback } from "react";
import { useScrollReveal } from "@/shared/hooks/useScrollReveal";
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
  const contentRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const epithetRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const copyBoxRef = useRef<HTMLDivElement>(null);

  const activeIndexRef = useRef(0);
  const demoRunningRef = useRef(true);
  const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useScrollReveal(contentRef as React.RefObject<Element>, {
    y: 50,
    duration: 0.9,
  });
  useScrollReveal(gridRef as React.RefObject<Element>, {
    selector: ".legend-card",
    y: 40,
    stagger: 0.06,
    duration: 0.75,
    start: "top 85%",
  });

  // ── Update copy box (fade out → update text → fade in) ──────────────────
  const updateCopy = useCallback((index: number) => {
    const player = PLAYERS[index];
    if (!player || !copyBoxRef.current) return;

    copyBoxRef.current.style.opacity = "0";
    copyBoxRef.current.style.transform = "translateY(5px)";

    setTimeout(() => {
      if (nameRef.current) nameRef.current.textContent = player.name;
      if (epithetRef.current) epithetRef.current.textContent = player.epithet;
      if (quoteRef.current) quoteRef.current.textContent = player.quote;
      if (copyBoxRef.current) {
        copyBoxRef.current.style.opacity = "1";
        copyBoxRef.current.style.transform = "translateY(0)";
      }
    }, 120);
  }, []);

  // ── Activate a card visually ─────────────────────────────────────────────
  const activateCard = useCallback(
    (index: number) => {
      if (!gridRef.current) return;
      const cards =
        gridRef.current.querySelectorAll<HTMLButtonElement>(".legend-card");
      cards.forEach((c) => c.classList.remove("demo-active"));
      const card = cards[index];
      if (card) card.classList.add("demo-active");
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
      activeIndexRef.current = (activeIndexRef.current + 1) % PLAYERS.length;
      activateCard(activeIndexRef.current);
    }, 1600);
  }, [activateCard]);

  const pauseDemo = useCallback(() => {
    demoRunningRef.current = false;
    if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    if (!gridRef.current) return;
    gridRef.current
      .querySelectorAll<HTMLButtonElement>(".legend-card")
      .forEach((c) => c.classList.remove("demo-active"));
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      activeIndexRef.current = 0;
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

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-22 overflow-hidden"
      id="legends-v2-section"
      aria-label="Play Chess Legends section"
    >
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "var(--obsidian)" }}
        aria-hidden="true"
      />
      {/* Ambient gold orb */}
      <div
        className="absolute top-1/2 left-1/4 w-[425px] h-[425px] rounded-full blur-[140px] pointer-events-none -translate-y-1/2"
        style={{ background: "rgba(155,122,214,0.04)" }}
        aria-hidden="true"
      />

      <div className="max-w-[1275px] mx-auto px-2 sm:px-6 lg:px-8 relative z-10">
        {/*
          Layout: text LEFT (~0.78fr) | grid RIGHT (~1.55fr)
          Opposite of 3rd.html which had grid-left, text-right.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-[0.78fr_1.55fr] items-center gap-10 lg:gap-16">
          {/* ── Left: Text content + rotating quote ─────────────────────── */}
          <div
            ref={contentRef}
            className="max-w-[485px] text-left lg:text-left"
            style={{ opacity: 0 }}
          >
            <h2
              ref={titleRef}
              className="font-display"
              style={{
                fontSize: "clamp(32px, 3vw, 49px)",
                lineHeight: 1.02,
                letterSpacing: "-0.035em",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: "26px",
              }}
            >
              Play Chess Legends
            </h2>

            {/* Dynamic copy — fades in/out on card change */}
            <div
              ref={copyBoxRef}
              aria-live="polite"
              style={{
                minHeight: "185px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                transition: "opacity 0.14s ease, transform 0.14s ease",
              }}
            >
              <h3
                ref={nameRef}
                className="font-display font-bold"
                style={{
                  fontSize: "clamp(20px, 1.7vw, 26px)",
                  lineHeight: 1.15,
                  color: "var(--text-primary)",
                  marginBottom: "5px",
                }}
              >
                Choose a legend
              </h3>
              <div
                ref={epithetRef}
                className="font-sans font-bold text-xs tracking-wide"
                style={{
                  color: "rgba(155,122,214,0.9)",
                  marginBottom: "14px",
                  letterSpacing: "0.01em",
                }}
              >
                Hover over a player
              </div>
              <p
                ref={quoteRef}
                className="font-serif"
                style={{
                  fontSize: "clamp(15px, 1.2vw, 19px)",
                  lineHeight: 1.55,
                  color: "var(--text-secondary)",
                  maxWidth: "425px",
                  fontStyle: "italic",
                }}
              >
                Every player has a different personality, style, and story.
              </p>
              {/* Attribution line — appears alongside the quote */}
              <div
                id="legends-v2-attribution"
                className="font-mono text-[11px] mt-3"
                style={{
                  color: "var(--text-tertiary)",
                  letterSpacing: "0.08em",
                  minHeight: "1em",
                }}
              />
            </div>

            {/* CTA */}
            <Link
              id="legends-v2-challenge-btn"
              to="/play"
              className="inline-flex items-center justify-center font-sans font-bold rounded-[12px] cta-shine"
              style={{
                width: "min(100%, 320px)",
                minHeight: "58px",
                fontSize: "clamp(17px, 1.35vw, 20px)",
                border: "1px solid var(--marble-border)",
                background:
                  "linear-gradient(135deg, rgba(155,122,214,0.12) 0%, rgba(155,122,214,0.04) 100%)",
                color: "var(--text-primary)",
                cursor: "pointer",
                transition:
                  "transform 0.16s ease, background 0.16s ease, border-color 0.16s ease",
                marginTop: "26px",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-2px)";
                el.style.background =
                  "linear-gradient(135deg, rgba(155,122,214,0.2) 0%, rgba(155,122,214,0.08) 100%)";
                el.style.borderColor = "rgba(155,122,214,0.5)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "";
                el.style.background =
                  "linear-gradient(135deg, rgba(155,122,214,0.12) 0%, rgba(155,122,214,0.04) 100%)";
                el.style.borderColor = "var(--marble-border)";
              }}
            >
              Challenge a Legend
            </Link>
          </div>

          {/* ── Right: 3×3 coach image grid ─────────────────────────────── */}
          <div className="relative">
            <div
              ref={gridRef}
              id="legends-v2-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "15px",
              }}
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
                  onHover={(idx) => {
                    pauseDemo();
                    if (resumeTimerRef.current)
                      clearTimeout(resumeTimerRef.current);
                    updateCopy(idx);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scoped styles for demo-active and card hover */}
      <style>{`
        .legend-card {
          aspect-ratio: 1;
          border-radius: 14px;
          border: 2.5px solid transparent;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          padding: 0;
          background: var(--obsidian-light);
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }
        .legend-card:hover,
        .legend-card:focus-visible,
        .legend-card.demo-active {
          transform: translateY(-4px) scale(1.025);
          border-color: rgba(155,122,214,0.85);
          box-shadow: 0 0 0 2px rgba(155,122,214,0.07), 0 0 24px rgba(155,122,214,0.34);
          outline: none;
        }
        .legend-card:focus-visible {
          outline: 2.5px solid var(--gold-bright);
          outline-offset: 2.5px;
        }
      `}</style>
    </section>
  );
}

// ── LegendCard sub-component ─────────────────────────────────────────────────
type PlayerData = (typeof PLAYERS)[number];

function LegendCard({
  player,
  index,
  onHover,
}: {
  player: PlayerData;
  index: number;
  onHover: (idx: number) => void;
}) {
  return (
    <button
      type="button"
      className="legend-card"
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
