/**
 * HeroV2.tsx
 * New hero section — video frame left, content+CTA right.
 * Inspired by new-hero.html layout.
 *
 * Layout: 4:3 video placeholder on the left (larger column ~60%),
 *         headline + subtitle + CTA on the right (~40%).
 * Reuses: useMagneticButton, useButtonGlow, existing play icon & animations.
 */

import { useRef, useState, useEffect } from "react";
import { useGSAP } from "@/shared/hooks/useGSAP";
import { useMagneticButton } from "@/shared/hooks/useMagneticButton";
import { useButtonGlow } from "@/shared/hooks/useButtonGlow";
import { gsap, dur, ease } from "@/shared/lib/gsapConfig";
import { AuthModal } from "@/features/account/AuthModal";
import { useSearchParams, Link } from "react-router";

export default function HeroV2() {
  // ── Auth modal (same pattern as Hero.tsx) ────────────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(
    () => searchParams.get("login") === "true",
  );
  const [modalMode, setModalMode] = useState<"login" | "register">("login");

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

  // ── Refs ──────────────────────────────────────────────────────────────────
  const heroRef = useRef<HTMLElement>(null);
  const playIconRef = useRef<HTMLImageElement>(null);
  const playTextRef = useRef<HTMLSpanElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const videoColRef = useRef<HTMLDivElement>(null);

  const primaryGlowRef = useButtonGlow<HTMLAnchorElement>();

  // Magnetic on the icon (follows cursor inside the button)
  useMagneticButton({
    targetRef: playIconRef,
    containerRef: primaryGlowRef,
    magneticStrength: 1.0,
  });

  // ── GSAP entrance ─────────────────────────────────────────────────────────
  useGSAP(
    () => {
      if (!heroRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: ease.out } });

      // Video column: slides in from left
      tl.fromTo(
        videoColRef.current,
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: dur(1.1), ease: "expo.out" },
        0.1,
      );

      // Headline
      if (headlineRef.current) {
        const words = headlineRef.current.textContent?.split(" ") || [];
        headlineRef.current.setAttribute("aria-label", words.join(" "));
        headlineRef.current.innerHTML = words
          .map(
            (w) =>
              `<span class="inline-block overflow-hidden"><span class="inline-block" style="display:inline-block;opacity:0;transform:translateY(28px)">${w}</span></span>`,
          )
          .join(" ");

        const innerSpans = headlineRef.current.querySelectorAll("span > span");
        tl.to(
          innerSpans,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.06,
            ease: "expo.out",
          },
          0.3,
        );
      }

      // Subtitle blur reveal
      tl.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 16, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "expo.out",
        },
        "-=0.4",
      );

      // CTA spring
      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: dur(0.6), ease: ease.spring },
        "-=0.45",
      );

      // Play icon glow pulse
      if (playIconRef.current) {
        gsap.to(playIconRef.current, {
          filter: "none",
          duration: 2.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      // CTA char hover animation
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
      className="relative py-12 md:py-16 overflow-hidden"
      id="hero-v2-section"
    >
      <div className="max-w-[1275px] mx-auto px-2 sm:px-2 lg:px-8 relative z-10">
        {/*
          Grid: video ~60% / content ~40%
          On mobile: stacks to column (video first, then content)
        */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_0.75fr] items-center gap-8 lg:gap-14">
          {/* ── Left: Video placeholder ──────────────────────────────────── */}
          <div
            ref={videoColRef}
            className="w-full flex justify-center lg:justify-start"
            style={{ opacity: 0 }}
          >
            {/*
              4:3 aspect-ratio video frame — scaled down by 15%
            */}
            <div
              className="relative w-full max-w-[646px] overflow-hidden"
              style={{
                aspectRatio: "4/3",
                borderRadius: "15px",
                border: "2px solid var(--marble-border)",
                background: "var(--obsidian-light)",
                boxShadow: "none",
              }}
            >
              {/* Actual video element — src intentionally left empty */}
              <video
                id="hero-v2-video"
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
                preload="none"
                /* src="" — add video source here when ready */
              />

              {/* Decorative diagonal lines (same as new-hero.html) */}
              <div
                className="absolute inset-0 pointer-events-none"
                aria-hidden="true"
                style={{
                  background:
                    "linear-gradient(135deg, var(--marble-light) 0%, transparent 50%), linear-gradient(225deg, var(--marble-light) 0%, transparent 50%)",
                }}
              />

              {/* Placeholder overlay — hidden when video is loaded */}
              <div
                className="video-placeholder-overlay absolute inset-0 flex flex-col items-center justify-center gap-2.5"
                style={{ color: "var(--text-tertiary)", zIndex: 2 }}
              >
                {/* Corner accents */}
                <div
                  className="absolute top-3.5 left-3.5 w-5 h-5 border-t-2 border-l-2 pointer-events-none"
                  style={{ borderColor: "var(--marble-border)" }}
                />
                <div
                  className="absolute top-3.5 right-3.5 w-5 h-5 border-t-2 border-r-2 pointer-events-none"
                  style={{ borderColor: "var(--marble-border)" }}
                />
                <div
                  className="absolute bottom-3.5 left-3.5 w-5 h-5 border-b-2 border-l-2 pointer-events-none"
                  style={{ borderColor: "var(--marble-border)" }}
                />
                <div
                  className="absolute bottom-3.5 right-3.5 w-5 h-5 border-b-2 border-r-2 pointer-events-none"
                  style={{ borderColor: "var(--marble-border)" }}
                />

                {/* Video icon */}
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 60,
                    height: 60,
                    border: "2px solid var(--marble-border)",
                    background: "rgba(212,175,110,0.04)",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M8 5.14v13.72L19 12 8 5.14z"
                      fill="var(--gold-dim)"
                      opacity="0.7"
                    />
                  </svg>
                </div>
                <span
                  className="font-mono text-[10px] tracking-widest uppercase"
                  style={{
                    color: "var(--text-tertiary)",
                    letterSpacing: "0.14em",
                  }}
                >
                  4 : 3
                </span>
              </div>
            </div>
          </div>

          {/* ── Right: Content ───────────────────────────────────────────── */}
          <div className="w-full max-w-[520px] lg:max-w-none text-left lg:text-left space-y-6">
            {/* Headline — inspired by the big bold font in new-hero.html */}
            <h1
              ref={headlineRef}
              className="font-display tracking-editorial"
              style={{
                fontSize: "clamp(32px, 2.9vw, 48px)",
                lineHeight: 0.98,
                letterSpacing: "-0.045em",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              Play chess on the #1 site!
            </h1>

            {/* Subtitle */}
            <p
              ref={subtitleRef}
              className="font-sans leading-relaxed"
              style={{
                fontSize: "clamp(15px, 1.25vw, 20px)",
                color: "var(--text-secondary)",
                maxWidth: 476,
                opacity: 0,
              }}
            >
              Turn your journey to chess mastery into an adventure.
            </p>

            {/* CTA — scaled down by 15% with 3D tactile design, magnetic icon, and shine */}
            <div ref={ctaRef} style={{ opacity: 0 }}>
              <Link
                ref={primaryGlowRef}
                to="/play"
                id="hero-v2-cta-primary"
                className="
                  hero-v2-play-btn
                  inline-flex items-center justify-center
                  btn-glow-container btn-glow-accent cta-shine
                  group select-none
                "
                style={{
                  width: "min(100%, 442px)",
                  minHeight: "73px",
                  borderRadius: "12px",
                  fontSize: "clamp(22px, 1.85vw, 29px)",
                  fontWeight: 800,
                  textDecoration: "none",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  transformStyle: "preserve-3d",
                  willChange: "transform",
                }}
              >
                <img
                  ref={playIconRef}
                  src="/play icon.png"
                  alt="Play"
                  style={{
                    width: "48px",
                    height: "48px",
                    objectFit: "contain",
                    willChange: "transform, filter",
                    transformOrigin: "center center",
                    flexShrink: 0,
                  }}
                  draggable={false}
                />
                <span
                  ref={playTextRef}
                  className="ml-2.5 font-sans font-extrabold flex overflow-hidden tracking-tight"
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
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hero-v2-play-btn {
          background: linear-gradient(135deg, #F0D59D 0%, #D4AF6E 45%, #B8934A 100%);
          color: #080B14;
          box-shadow: 0 5px 0 #7A5B22, 0 10px 20px rgba(0, 0, 0, 0.35);
          transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
        }
        .hero-v2-play-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.06);
          box-shadow: 0 7px 0 #7A5B22, 0 14px 24px rgba(0, 0, 0, 0.4);
        }
        .hero-v2-play-btn:active {
          transform: translateY(3px);
          box-shadow: 0 2px 0 #7A5B22, 0 5px 12px rgba(0, 0, 0, 0.25);
        }
        :root[data-theme="light"] .hero-v2-play-btn {
          background: linear-gradient(135deg, #C28224 0%, #945C10 50%, #7A490B 100%);
          color: #FAF6F0;
          box-shadow: 0 5px 0 #4D2D04, 0 10px 20px rgba(0, 0, 0, 0.18);
        }
        :root[data-theme="light"] .hero-v2-play-btn:hover {
          box-shadow: 0 7px 0 #4D2D04, 0 14px 24px rgba(0, 0, 0, 0.22);
        }
        :root[data-theme="light"] .hero-v2-play-btn:active {
          box-shadow: 0 2px 0 #4D2D04, 0 5px 12px rgba(0, 0, 0, 0.15);
        }
        @media (max-width: 600px) {
          .hero-v2-play-btn {
            min-height: 60px !important;
            font-size: 22px !important;
          }
        }
      `}</style>

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={modalMode}
      />
    </header>
  );
}
