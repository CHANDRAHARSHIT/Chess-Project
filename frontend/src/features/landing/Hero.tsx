/**
 * Hero.tsx
 * Landing hero section with premium GSAP animations and chess puzzle.
 * Redesigned to match the assignment directory exactly.
 */

import { useRef, useState, useEffect } from "react";
import { useGSAP } from "@/shared/hooks/useGSAP";
import { useMagneticButton } from "@/shared/hooks/useMagneticButton";
import { useButtonGlow } from "@/shared/hooks/useButtonGlow";
import { gsap, dur, ease } from "@/shared/lib/gsapConfig";
import HeroPuzzle from "./HeroPuzzle";
import { AuthModal } from "@/features/account/AuthModal";
import { useSearchParams, Link } from "react-router";

export default function Hero() {
  // Authentication states — derive initial values from URL on mount via lazy initialisers
  // so we never call setState synchronously inside an effect (react-hooks/set-state-in-effect).
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(
    () => searchParams.get("login") === "true",
  );
  const [modalMode, setModalMode] = useState<"login" | "register">("login");

  // Only side effect: remove the ?login=true query param from the URL so it
  // doesn't persist across refreshes. This runs once on mount.
  useEffect(() => {
    if (searchParams.get("login") === "true") {
      queueMicrotask(() => {
        setModalMode("login");
        setIsModalOpen(true);
      });

      const newParams = new URLSearchParams(searchParams);
      newParams.delete("login");
      setSearchParams(newParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Animation refs ────────────────────────────────────────────────────────
  const heroRef = useRef<HTMLElement>(null);
  const playIconRef = useRef<HTMLImageElement>(null);
  const playTextRef = useRef<HTMLSpanElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const subPara2Ref = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const boardColRef = useRef<HTMLDivElement>(null);
  const boardCardRef = useRef<HTMLDivElement>(null);

  const primaryGlowRef = useButtonGlow<HTMLAnchorElement>();

  useMagneticButton({
    targetRef: playIconRef,
    containerRef: primaryGlowRef,
    magneticStrength: 1.0,
  });

  // ── GSAP entrance animations ───────────────────────────────────────────────
  useGSAP(
    () => {
      if (!heroRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: ease.out } });

      // Make containers visible
      if (line1Ref.current) line1Ref.current.style.opacity = "1";
      if (subtitleRef.current) subtitleRef.current.style.opacity = "1";

      // ── Custom SplitText Utility ─────────────────────────────────────────
      const splitText = (
        element: HTMLElement | null,
        type: "char" | "word",
      ) => {
        if (!element) return { spans: [] };
        const text = element.textContent?.trim() || "";
        element.setAttribute("aria-label", text);
        element.innerHTML = "";
        const chunks = type === "char" ? text.split("") : text.split(" ");
        const spans: HTMLSpanElement[] = [];
        chunks.forEach((chunk, index) => {
          if (type === "char" && chunk === " ") {
            element.appendChild(document.createTextNode(" "));
            return;
          }
          const span = document.createElement("span");
          span.style.display = "inline-block";
          span.style.opacity = "0";
          span.style.willChange = "transform, opacity";
          span.setAttribute("aria-hidden", "true");
          span.textContent = chunk;
          element.appendChild(span);
          spans.push(span);
          if (type === "word" && index < chunks.length - 1) {
            element.appendChild(document.createTextNode(" "));
          }
        });
        return { spans };
      };

      const splitL1 = splitText(line1Ref.current, "word");
      const splitS2 = splitText(subPara2Ref.current, "word");

      // ② Headline — cinematic stagger
      tl.fromTo(
        [...splitL1.spans, line2Ref.current].filter(
          (el): el is HTMLElement => el !== null,
        ),
        { opacity: 0, y: 30, rotationX: 25 },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          duration: 0.9,
          stagger: 0.07,
          ease: "expo.out",
          transformOrigin: "50% 100%",
        },
        0.35,
      );

      // Rule reveal
      tl.fromTo(
        ruleRef.current,
        { width: 0, opacity: 0 },
        { width: "40px", opacity: 1, duration: 0.8, ease: "expo.out" },
        "-=0.2",
      );

      // ③ Subtitle — word-by-word blur dissolve
      tl.fromTo(
        splitS2.spans,
        { opacity: 0, y: 16, filter: "blur(5px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.85,
          stagger: 0.018,
          ease: "expo.out",
        },
        "-=0.5",
      );

      // ④ CTA — spring entrance
      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: dur(0.6), ease: ease.spring },
        "-=0.35",
      );

      // ⑤ Board column — subtle fade-in
      tl.fromTo(
        boardColRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: dur(1.3),
          ease: "power2.out",
        },
        0.25,
      );

      // ── Background orbs drift ──────────────────────────────────────────
      const orbA = heroRef.current.querySelector(".hero-orb-a");
      const orbB = heroRef.current.querySelector(".hero-orb-b");
      if (orbA) {
        gsap.to(orbA, {
          x: "+=60",
          y: "-=40",
          scale: 1.15,
          duration: 18,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }
      if (orbB) {
        gsap.to(orbB, {
          x: "-=40",
          y: "+=60",
          scale: 0.9,
          duration: 22,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      const orbC = heroRef.current.querySelector(".hero-orb-c");
      if (orbC) {
        gsap.to(orbC, {
          x: "+=30",
          y: "-=20",
          scale: 1.1,
          duration: 14,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      // ── Play icon glow pulse ───────────────────────────────────────────
      if (playIconRef.current) {
        gsap.to(playIconRef.current, {
          filter: "none",
          duration: 2.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      // ── CTA text char animation on hover ───────────────────────────────
      const ctaEl = primaryGlowRef.current;
      const textEl = playTextRef.current;
      if (ctaEl && textEl) {
        const chars = textEl.querySelectorAll(".play-char");
        const isPointer = window.matchMedia(
          "(hover: hover) and (pointer: fine)",
        ).matches;

        if (isPointer) {
          const onMouseEnter = () => {
            gsap.to(chars, {
              y: -18,
              opacity: 0,
              duration: 0.22,
              stagger: 0.028,
              ease: "power2.in",
              overwrite: true,
            });
          };

          const resetChars = () => {
            gsap.fromTo(
              chars,
              { y: 16, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.38,
                stagger: 0.045,
                ease: "back.out(1.6)",
                overwrite: true,
              },
            );
          };

          ctaEl.addEventListener("mouseenter", onMouseEnter);
          ctaEl.addEventListener("mouseleave", resetChars);
          ctaEl.addEventListener("pointerleave", resetChars);

          return () => {
            ctaEl.removeEventListener("mouseenter", onMouseEnter);
            ctaEl.removeEventListener("mouseleave", resetChars);
            ctaEl.removeEventListener("pointerleave", resetChars);
            gsap.set(chars, { y: 0, opacity: 1 });
          };
        } else {
          // Force text visible and positioned properly on non-pointer (mobile/touch) devices
          gsap.set(chars, { y: 0, opacity: 1 });
        }
      }
    },
    heroRef,
    [],
  );

  return (
    <header
      ref={heroRef}
      className="relative pt-20 pb-20 md:pt-20 md:pb-32 overflow-hidden"
      id="hero-section"
    >
      {/* ── Background glow orbs ─────────────────────────────────────────── */}
      <div
        className="hero-orb-a absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: "rgba(212, 175, 110, 0.04)" }}
        aria-hidden="true"
      />
      <div
        className="hero-orb-b absolute top-0 right-10 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "rgba(212, 175, 110, 0.03)" }}
        aria-hidden="true"
      />
      <div
        className="hero-orb-c absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "rgba(180, 147, 74, 0.02)" }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* ── Text Column ────────────────────────────────────────────────── */}
          <div className="w-full lg:w-[55%] space-y-8 md:space-y-10 text-left">
            {/* Editorial headline */}
            <h1
              className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-7xl tracking-editorial leading-[0.95]"
              style={{ color: "var(--text-primary)" }}
            >
              <span ref={line1Ref} className="block" style={{ opacity: 0 }}>
                Build the Future of
              </span>
              <span
                ref={line2Ref}
                className="block text-gold-gradient font-display"
                style={{ opacity: 0, fontStyle: "italic", fontWeight: 400 }}
              >
                Online Chess
              </span>
            </h1>

            {/* Gold rule */}
            <div
              ref={ruleRef}
              className="hero-rule"
              style={{ width: 0, opacity: 0 }}
              aria-hidden="true"
            />

            {/* Subtitle */}
            <div
              ref={subtitleRef}
              className="space-y-4 max-w-xl"
              style={{ opacity: 0 }}
            >
              <p
                ref={subPara2Ref}
                className="font-sans text-base sm:text-lg leading-relaxed font-normal"
                style={{ color: "var(--text-secondary)" }}
              >
                A complete chess platform to play, learn, compete, and grow -
                built to become the world's #1 destination for chess.
              </p>
            </div>

            {/* CTA */}
            <div
              ref={ctaRef}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
              style={{ opacity: 0 }}
            >
              <Link
                ref={primaryGlowRef}
                to="/play"
                id="hero-cta-primary"
                className="
                  inline-flex items-center justify-center
                  font-sans font-semibold text-[16px]
                  rounded-sm
                  btn-premium-cta btn-glow-container btn-glow-accent cta-shine
                  group
                "
                style={{
                  transformStyle: "preserve-3d",
                  willChange: "transform",
                  width: "140px",
                  height: "60px",
                  padding: "0 10px",
                  fontSize: "13px",
                }}
              >
                <img
                  ref={playIconRef}
                  src="/play icon.png"
                  alt="Play"
                  style={{
                    width: "58px",
                    height: "58px",
                    objectFit: "contain",
                    willChange: "transform, filter",
                    transformOrigin: "center center",
                    flexShrink: 0,
                  }}
                  draggable={false}
                />
                <span
                  ref={playTextRef}
                  className="ml-2 font-sans font-semibold text-[16px] flex overflow-hidden pb-1.5 -mb-1.5 pt-0.5"
                  style={{ lineHeight: 1.25 }}
                >
                  {"Play".split("").map((char, i) => (
                    <span
                      key={i}
                      className="play-char inline-block"
                      style={{ display: "inline-block", paddingBottom: "3px" }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              </Link>
            </div>
          </div>

          {/* ── Chessboard / Puzzle Column ──────────────────────────────────── */}
          <div
            ref={boardColRef}
            className="w-full lg:w-[45%] flex justify-center lg:justify-end"
            style={{
              opacity: 0,
            }}
          >
            <div className="w-full max-w-[540px] relative mt-8 lg:mt-0">
              {/* Board card — luxury obsidian + gold hairline */}
              <div
                ref={boardCardRef}
                className="luxury-card overflow-hidden hero-board-card p-4 md:p-6"
                style={{ borderRadius: "2px" }}
              >
                {/* Engraved coordinate decoration — top right corner */}
                <div
                  className="card-coordinate"
                  style={{ top: "12px", right: "14px", bottom: "auto" }}
                  aria-hidden="true"
                ></div>

                {/* Board Area */}
                <div className="board-cursor-glow">
                  <HeroPuzzle />
                </div>
              </div>

              {/* Floating micro-particles around board */}
              <div className="hero-particles" aria-hidden="true">
                {["e4", "Nf3", "♔", "d5", "O-O", "♖", "c4", "♗"].map(
                  (glyph, i) => (
                    <span
                      key={i}
                      className={`hero-particle hero-particle-${i + 1}`}
                    >
                      {glyph}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Reusable Auth Modal */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={modalMode}
      />
    </header>
  );
}
