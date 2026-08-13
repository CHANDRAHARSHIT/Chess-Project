/**
 * Features.tsx — "Why Ownership Matters"
 *
 * Premium upgrades (ported from Chess-Project-Assignment):
 *   - luxury-card glass system with chess-inspired metallic borders
 *   - Card-level GSAP perspective tilt hover effect (desktop only)
 *   - Chess coordinate accent on each card
 *   - Feature icon boxes with gold accents
 *   - Section eyebrow label
 *   - Editorial Cormorant Garamond typography
 *   - ScrollTrigger: staggered perspective entrance (rotationX + y + blur)
 */

import { useRef, useEffect, useCallback } from 'react';
import { Users, ShieldAlert, GraduationCap } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useGSAP } from '../hooks/useGSAP';
import { gsap, dur } from '../utils/gsapConfig';

// ── Individual premium card with perspective tilt ─────────────────────────────
function FeatureCard({
  icon,
  title,
  description,
  coordinate,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  coordinate: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    gsap.to(card, {
      rotationX: -dy * 5,
      rotationY: dx * 5,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 0.4,
      ease: 'power2.out',
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    gsap.to(card, {
      rotationX: 0,
      rotationY: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 0.7,
      ease: 'elastic.out(1, 0.5)',
    });
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (!window.matchMedia('(hover: hover)').matches) return;
    card.addEventListener('mousemove', handleMouseMove as EventListener);
    card.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      card.removeEventListener('mousemove', handleMouseMove as EventListener);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <div
      ref={cardRef}
      className="luxury-card p-8 md:p-10 flex flex-col items-start text-left space-y-6"
      style={{
        opacity: 0,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        borderRadius: '2px',
      }}
    >
      {/* Chess board micropattern */}
      <div className="card-board-pattern" aria-hidden="true" />

      {/* Coordinate accent */}
      <div className="card-coordinate" aria-hidden="true">{coordinate}</div>

      {/* Icon */}
      <div className="feature-icon-box">
        {icon}
      </div>

      {/* Content */}
      <div className="space-y-3 relative z-10">
        <h3
          className="font-display text-xl md:text-2xl font-semibold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
        >
          {title}
        </h3>
        <p
          className="font-sans text-sm leading-relaxed"
          style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef  = useRef<HTMLDivElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);

  // Header reveal
  useScrollReveal(headerRef as React.RefObject<Element | null>, { y: 50, duration: 0.8 });

  // Cards stagger — perspective entrance
  useGSAP(
    () => {
      if (!gridRef.current) return;
      const cards = gridRef.current.querySelectorAll('.luxury-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 60, rotationX: 20, filter: 'blur(4px)' },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          filter: 'blur(0px)',
          duration: dur(0.9),
          stagger: 0.14,
          ease: 'expo.out',
          transformOrigin: '50% 0%',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    },
    sectionRef,
    []
  );

  const cards = [
    {
      icon: <Users className="w-5 h-5" style={{ color: 'var(--gold-bright)' }} />,
      title: 'Audience Ownership',
      description:
        'Your audience belongs to you, not a third-party platform. Maintain direct, uninterrupted access to your subscribers, email lists, and analytics without being subject to algorithm updates or fee increases.',
      coordinate: 'a1 · a8',
    },
    {
      icon: <ShieldAlert className="w-5 h-5" style={{ color: 'var(--gold-bright)' }} />,
      title: 'Brand Independence',
      description:
        'Establish a premium destination under your own custom domain. Seamlessly configure your logos, colors, and layout settings to ensure your chess brand remains the primary touchpoint for your community.',
      coordinate: 'e1 · e8',
    },
    {
      icon: <GraduationCap className="w-5 h-5" style={{ color: 'var(--gold-bright)' }} />,
      title: 'Learning Experience',
      description:
        'Deliver instructional chess content through specialized tools. Design custom studies, host private tournaments, assign interactive chess problems, and track student ratings through a unified academic ledger.',
      coordinate: 'h1 · h8',
    },
  ];

  return (
    <>
      <div className="section-divider" aria-hidden="true" />

      <section
        ref={sectionRef}
        id="why-ownership"
        className="relative py-28 md:py-40 overflow-hidden"
        style={{ background: 'rgba(10, 13, 26, 0.6)' }}
      >
        {/* Ambient glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[160px] pointer-events-none"
          style={{ background: 'rgba(212, 175, 110, 0.02)' }}
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Section Header */}
          <div
            ref={headerRef}
            className="text-center max-w-3xl mx-auto mb-20 md:mb-28 space-y-6"
            style={{ opacity: 0 }}
          >
            <div className="section-eyebrow justify-center" aria-hidden="true">
              Why Independence Matters
            </div>

            <h2
              className="font-display text-5xl sm:text-6xl md:text-7xl tracking-tight leading-[0.95]"
              style={{ color: 'var(--text-primary)' }}
            >
              Why Ownership{' '}
              <span className="block text-gold-gradient font-display" style={{ fontStyle: 'italic', fontWeight: 400 }}>
                Matters
              </span>
            </h2>

            <p
              className="font-sans text-base sm:text-[17px] leading-relaxed max-w-xl mx-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              Leading chess educators and creators are moving away from closed ecosystems.
              XLChess provides the infrastructure to build, brand, and scale
              your digital assets independently.
            </p>
          </div>

          {/* Cards Grid */}
          <div
            ref={gridRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
            style={{ perspective: '1000px' }}
          >
            {cards.map((card, i) => (
              <FeatureCard
                key={i}
                icon={card.icon}
                title={card.title}
                description={card.description}
                coordinate={card.coordinate}
              />
            ))}
          </div>

        </div>
      </section>
    </>
  );
}
