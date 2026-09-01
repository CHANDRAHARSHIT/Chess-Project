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
              `<span class="inline-block overflow-hidden pb-3 -mb-3"><span class="inline-block" style="display:inline-block;opacity:0;transform:translateY(32px);padding-bottom:6px">${w}</span></span>`,
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
              y: -22,
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
              { y: 22, opacity: 0 },
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
      className="v2-hero py-12 md:py-16 relative overflow-hidden"
      id="hero-v2-section"
    >
      <div className="v2-hero-grid max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        {/* ── Left: Video placeholder ── */}
        <div
          ref={videoColRef}
          className="w-full flex justify-center lg:justify-start"
          style={{ opacity: 0 }}
        >
          <div className="v2-video-frame relative w-full max-w-[912px]">
            {/* Actual video element */}
            <video
              id="hero-v2-video"
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              preload="none"
            />

            {/* Placeholder overlay */}
            <div className="v2-video-placeholder">
              <div className="v2-play-circle">▶</div>
              <span>4:3</span>
            </div>
          </div>
        </div>

        {/* ── Right: Content ── */}
        <div className="v2-content w-full max-w-[610px] space-y-6 justify-self-center">
          <h1 ref={headlineRef} className="v2-h1">
            Play chess on the #1 site!
          </h1>

          <p ref={subtitleRef} className="v2-subtitle" style={{ opacity: 0 }}>
            Turn your journey to chess mastery into an adventure.
          </p>

          <div ref={ctaRef} style={{ opacity: 0 }}>
            <Link
              ref={primaryGlowRef}
              to="/play"
              id="hero-v2-cta-primary"
              className="v2-play-button hero-v2-play-btn btn-glow-container cta-shine group select-none"
            >
              <img
                ref={playIconRef}
                src="/play icon.png"
                alt="Play"
                draggable={false}
              />
              <span
                ref={playTextRef}
                className="font-extrabold flex overflow-hidden tracking-tight pb-2 -mb-2 pt-0.5"
                style={{ lineHeight: 1.25 }}
              >
                {"Play".split("").map((char, i) => (
                  <span
                    key={i}
                    className="play-char inline-block"
                    style={{ display: "inline-block", paddingBottom: "4px" }}
                  >
                    {char}
                  </span>
                ))}
              </span>
            </Link>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={modalMode}
      />
    </header>
  );
}
