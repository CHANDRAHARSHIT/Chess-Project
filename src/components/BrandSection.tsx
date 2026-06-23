/**
 * BrandSection.tsx
 * Mirrored hero-style section placed directly below the Hero.
 * Image on left, text on right (desktop). Image top, text bottom (mobile).
 * GSAP ScrollTrigger animations: image slides from left, text slides from right.
 */

import { useRef } from 'react';
import { useGSAP } from '../hooks/useGSAP';
import { gsap, dur } from '../utils/gsapConfig';

export default function BrandSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current || !imageRef.current || !textRef.current) return;

      // Image — slide in from left
      gsap.fromTo(
        imageRef.current,
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: dur(1),
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Text — slide in from right
      gsap.fromTo(
        textRef.current,
        { x: 40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: dur(1),
          delay: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    },
    sectionRef,
    []
  );

  return (
    <section
      ref={sectionRef}
      id="brand-section"
      className="relative py-20 md:py-28 overflow-hidden bg-brand-bg"
    >
      {/* Soft blue ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: 'rgba(99, 102, 241, 0.06)' }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — Image */}
          <div
            ref={imageRef}
            className="flex justify-center"
            style={{ opacity: 0 }}
          >
            <div className="rounded-2xl overflow-hidden border border-brand-border/40 shadow-2xl"
              style={{
                boxShadow: '0 0 60px rgba(99, 102, 241, 0.08), 0 25px 50px rgba(0, 0, 0, 0.3)',
              }}
            >
              <img
                src="/new section .png"
                alt="Build more than subscribers"
                className="w-full max-w-[640px] h-auto object-contain"
                draggable={false}
              />
            </div>
          </div>

          {/* Right — Text */}
          <div
            ref={textRef}
            className="space-y-6 text-left"
            style={{ opacity: 0 }}
          >
            <h2 className="font-sans font-extrabold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-[1.1]">
              <span className="block">Build More Than</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-accent via-indigo-400 to-violet-400">
                Subscribers
              </span>
            </h2>

            <div className="space-y-4">
              <p className="font-sans text-base sm:text-lg text-brand-secondary max-w-lg leading-relaxed">
                You've already done the hard part: building an audience.
              </p>
              <p className="font-sans text-base sm:text-lg text-brand-secondary max-w-lg leading-relaxed">
                Now build a platform around your brand.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
