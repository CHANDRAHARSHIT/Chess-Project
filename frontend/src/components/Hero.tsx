/**
 * Hero.tsx
 * Landing hero section with premium GSAP animations and chess puzzle.
 * Redesigned to match the assignment directory exactly.
 */

import { useRef, useState, useEffect } from "react";
import { useGSAP } from "../hooks/useGSAP";
import { usePerspectiveTilt } from "../hooks/usePerspectiveTilt";
import { useMagneticButton } from "../hooks/useMagneticButton";
import { useButtonGlow } from "../hooks/useButtonGlow";
import { gsap, dur, ease } from "../utils/gsapConfig";
import HeroPuzzle from "./HeroPuzzle";
import { AuthModal } from "./AuthModal";
import { useSearchParams } from "react-router";

export default function Hero() {
  // Authentication states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "register">("login");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("login") === "true") {
      setModalMode("login");
      setIsModalOpen(true);

      const newParams = new URLSearchParams(searchParams);
      newParams.delete("login");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // ── Animation refs ────────────────────────────────────────────────────────
  const heroRef = useRef<HTMLElement>(null);
  const heroLogoRef = useRef<HTMLImageElement>(null);
  const playIconRef = useRef<HTMLImageElement>(null);
  const playTextRef = useRef<HTMLSpanElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const subPara1Ref = useRef<HTMLParagraphElement>(null);
  const subPara2Ref = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const boardColRef = useRef<HTMLDivElement>(null);
  const boardCardRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isDragging) {
      const handlePointerUp = () => {
        setIsDragging(false);
      };
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("mouseup", handlePointerUp);
      window.addEventListener("touchend", handlePointerUp);
      return () => {
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("mouseup", handlePointerUp);
        window.removeEventListener("touchend", handlePointerUp);
      };
    }
  }, [isDragging]);

  // ── Perspective tilt hook (manages its own ref) ────────────────────────────
  const tiltRef = usePerspectiveTilt<HTMLDivElement>({
    maxRotate: 6,
    scalePeak: 1.03,
    quickToDuration: 0.35,
    quickToEase: "power2.out",
    floatDistance: 8,
    floatDuration: 3,
    paused: isDragging,
  });

  const primaryGlowRef = useButtonGlow<HTMLAnchorElement>();
  const ctaAnchorRef = useRef<HTMLAnchorElement>(null);

  // Merge glow ref onto the anchor element
  const mergedPlayRef = (el: HTMLAnchorElement | null) => {
    (
      primaryGlowRef as React.MutableRefObject<HTMLAnchorElement | null>
    ).current = el;
    (ctaAnchorRef as React.MutableRefObject<HTMLAnchorElement | null>).current =
      el;
  };

  useMagneticButton({
    targetRef: playIconRef,
    containerRef: ctaAnchorRef,
    magneticStrength: 1.0,
  });

  // ── GSAP entrance animations ───────────────────────────────────────────────
  useGSAP(
    () => {
      if (!heroRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: ease.out } });

      // ① Logo — cinematic fade-down
      tl.fromTo(
        heroLogoRef.current,
        { opacity: 0, y: -28, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.0,
          ease: "expo.out",
        },
        0,
      );

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
      const splitS1 = splitText(subPara1Ref.current, "word");
      const splitS2 = splitText(subPara2Ref.current, "word");

      // Eyebrow label reveal
      tl.fromTo(
        eyebrowRef.current,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.7, ease: "expo.out" },
        0.2,
      );

      // ② Headline — cinematic stagger
      tl.fromTo(
        [...splitL1.spans, line2Ref.current],
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
        [...splitS1.spans, ...splitS2.spans],
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

      // ⑤ Board column — cinematic entrance
      tl.fromTo(
        boardColRef.current,
        { opacity: 0, x: 90, rotation: -4 },
        {
          opacity: 1,
          x: 0,
          rotation: 0,
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
          filter: "drop-shadow(0 0 10px rgba(212, 175, 110, 0.5))",
          duration: 2.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      // ── CTA text char animation on hover ───────────────────────────────
      const ctaEl = ctaAnchorRef.current;
      const textEl = playTextRef.current;
      if (ctaEl && textEl) {
        const chars = textEl.querySelectorAll(".play-char");

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

        const onMouseLeave = () => {
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
        ctaEl.addEventListener("mouseleave", onMouseLeave);

        return () => {
          ctaEl.removeEventListener("mouseenter", onMouseEnter);
          ctaEl.removeEventListener("mouseleave", onMouseLeave);
        };
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 lg:items-center">
          {/* ── Text Column ────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 space-y-8 md:space-y-10 text-left">
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
                className="font-sans text-base sm:text-[17px] leading-relaxed"
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
              <a
                ref={mergedPlayRef}
                href="#interactive-demo"
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
                  className="ml-2 font-sans font-semibold text-[16px] flex overflow-hidden"
                  style={{ lineHeight: 1 }}
                >
                  {"Play".split("").map((char, i) => (
                    <span
                      key={i}
                      className="play-char inline-block"
                      style={{ display: "inline-block" }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              </a>
            </div>
          </div>

          {/* ── Chessboard / Puzzle Column ──────────────────────────────────── */}
          <div
            ref={boardColRef}
            className="lg:col-span-6 flex justify-center"
            style={{
              opacity: 0,
              perspective: "1000px",
            }}
          >
            <div
              ref={tiltRef}
              className="w-full max-w-[440px] md:max-w-[480px]"
              style={{
                transformStyle: "preserve-3d",
                willChange: "transform, filter",
              }}
            >
              {/* Board card — luxury obsidian + gold hairline */}
              <div
                ref={boardCardRef}
                className="shadow-deep overflow-hidden hero-board-card"
                style={{ transformStyle: "preserve-3d", borderRadius: "2px" }}
              >
                {/* Engraved coordinate decoration — top right corner */}
                <div
                  className="card-coordinate"
                  style={{ top: "12px", right: "14px", bottom: "auto" }}
                  aria-hidden="true"
                >
                  e4 · d5
                </div>

                {/* Board Area */}
                <div className="p-4 board-cursor-glow bg-brand-bg/95">
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
