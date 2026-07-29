/**
 * BrandSection.tsx
 * Mirrored hero-style section placed directly below the Hero.
 * Image on right, text on left (desktop).
 * GSAP ScrollTrigger animations: image slides from right, text slides from left.
 *
 * Design: Black & Gold premium — Cormorant Garamond headlines, gold CTA.
 */

import { useRef, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { useGSAP } from "../hooks/useGSAP";
import { gsap, dur } from "../utils/gsapConfig";
import { ArrowRight } from "lucide-react";

export default function BrandSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const artworkRef = useRef<HTMLDivElement>(null);

  // Perspective tilt hover on artwork image (same as Features card)
  const handleArtworkMouseMove = useCallback((e: MouseEvent) => {
    const el = artworkRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    gsap.to(el, {
      rotateX: -dy * 5,
      rotateY: dx * 5,
      scale: 1.12,
      duration: 0.4,
      ease: "power2.out",
    });
  }, []);

  const handleArtworkMouseLeave = useCallback(() => {
    const el = artworkRef.current;
    if (!el) return;
    gsap.to(el, {
      rotateX: 0,
      rotateY: 0,
      scale: 1.1,
      duration: 0.7,
      ease: "elastic.out(1, 0.5)",
    });
  }, []);

  useEffect(() => {
    const el = artworkRef.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    el.addEventListener("mousemove", handleArtworkMouseMove as EventListener);
    el.addEventListener("mouseleave", handleArtworkMouseLeave);
    return () => {
      el.removeEventListener(
        "mousemove",
        handleArtworkMouseMove as EventListener,
      );
      el.removeEventListener("mouseleave", handleArtworkMouseLeave);
    };
  }, [handleArtworkMouseMove, handleArtworkMouseLeave]);

  useGSAP(
    () => {
      if (!sectionRef.current || !imageRef.current || !textRef.current) return;

      // Text — fade right
      gsap.fromTo(
        textRef.current,
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: dur(1),
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        },
      );

      // Image — fade left
      gsap.fromTo(
        imageRef.current,
        { x: 40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: dur(1),
          delay: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        },
      );
    },
    sectionRef,
    [],
  );

  return (
    <section
      ref={sectionRef}
      id="brand-section"
      className="relative py-20 md:py-32 overflow-hidden"
    >
      {/* Gold ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: "rgba(212, 175, 110, 0.04)" }}
        aria-hidden="true"
      />

      {/* Subtle section divider at top */}
      <div className="absolute top-0 left-0 right-0">
        <div className="section-divider" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Banner Area */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left — Text Content */}
          <div
            ref={textRef}
            className="w-full lg:w-[55%] space-y-8 text-left"
            style={{ opacity: 0 }}
          >
            <div className="space-y-4 max-w-xl">
              <h2 className="font-display font-semibold text-4xl sm:text-5xl md:text-6xl text-brand-text tracking-tight leading-[1.05]">
                <span
                  className="block"
                  style={{ color: "var(--text-primary)" }}
                >
                  Build More Than
                </span>
                <span className="block text-gold-gradient">Subscribers</span>
              </h2>
            </div>

            <div className="space-y-1 max-w-lg">
              <p
                className="font-sans text-base sm:text-[19px] leading-relaxed font-light"
                style={{ color: "var(--text-secondary)" }}
              >
                You've already done the hard part: building an audience.
              </p>
              <p
                className="font-sans text-base sm:text-[19px] leading-relaxed font-light"
                style={{ color: "var(--text-secondary)" }}
              >
                Now build a platform around your brand that grows with you.
              </p>
            </div>

            <div className="pt-4">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-3 font-sans font-medium text-[15px] btn-premium-cta btn-glow-container cta-shine px-8 py-4 rounded-sm group transition-all duration-300"
                style={{ fontSize: "13px" }}
              >
                Build Your Platform
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right — Artwork Image */}
          <div
            ref={imageRef}
            className="w-full lg:w-[45%] flex justify-center lg:justify-end"
            style={{ opacity: 0, perspective: "1000px" }}
          >
            <div
              ref={artworkRef}
              className="luxury-card w-full max-w-[600px] relative scale-100 lg:scale-[1.1] origin-center lg:origin-right p-4 md:p-6 pb-8 mt-8 lg:mt-0"
              style={{ transformStyle: "preserve-3d", willChange: "transform" }}
            >
              {/* Chess board micropattern */}
              <div className="card-board-pattern" aria-hidden="true" />

              {/* Coordinate accent */}
              <div className="card-coordinate" aria-hidden="true">
                b1 · b8
              </div>

              {/* Gold ambient glow behind image */}
              <div
                className="absolute inset-0 rounded-full blur-[80px] mix-blend-screen pointer-events-none"
                style={{ background: "rgba(212, 175, 110, 0.08)" }}
              />
              <img
                src="/final%20banner.png"
                alt="Build More Than Subscribers Design"
                className="w-full h-auto object-contain relative z-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subtle section divider at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="section-divider" />
      </div>
    </section>
  );
}
