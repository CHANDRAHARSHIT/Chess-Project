/**
 * BuiltFor.tsx  ("Built For Independent Creators")
 * ScrollTrigger animations:
 *   - Header: fade-up
 *   - Target cards: staggered reveal (0.12s between)
 *
 * Design: Black & Gold premium
 */

import { useRef } from 'react';
import { UserCheck, Video, School, CheckCircle2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function BuiltFor() {
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useScrollReveal(headerRef as React.RefObject<Element | null>, { y: 50, duration: 0.8 });

  useScrollReveal(gridRef as React.RefObject<Element | null>, {
    selector: ':scope > div',
    y: 65,
    stagger: 0.12,
    duration: 0.75,
    start: 'top 85%',
  });

  const targets = [
    {
      icon: <UserCheck className="w-5 h-5" style={{ color: 'var(--gold-bright)' }} />,
      title: 'Chess Coaches',
      description:
        'Upgrade from Google Drive folders and messy chat logs. Keep students accountable with structured learning modules.',
      bullets: [
        'Organize custom exercises and puzzle homework',
        "Analyze students' games using built-in engine logs",
        'Direct billing and subscription management',
      ],
      coordinate: 'c1 · c8',
    },
    {
      icon: <Video className="w-5 h-5" style={{ color: 'var(--gold-bright)' }} />,
      title: 'Chess YouTubers',
      description:
        'Stop sending your hard-earned traffic to massive platforms that monetize your audience. Retain community value.',
      bullets: [
        'Offer subscriber-only opening preparation databases',
        'Host community tournaments and live streams',
        'Launch branded educational digital products',
      ],
      coordinate: 'f1 · f8',
    },
    {
      icon: <School className="w-5 h-5" style={{ color: 'var(--gold-bright)' }} />,
      title: 'Chess Academies',
      description:
        'Standardize operations and curriculum across multiple coaches. Maintain oversight on player progression.',
      bullets: [
        'Centralized dashboard for tracking students rating growth',
        'Standardized opening databases and training syllabus',
        'Multi-coach calendar booking and scheduling tools',
      ],
      coordinate: 'g1 · g8',
    },
  ];

  return (
    <section id="built-for" className="py-20 md:py-28 relative overflow-hidden" style={{ background: 'rgba(8, 11, 20, 0.7)' }}>
      <div className="section-divider absolute top-0 left-0 right-0" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div
          ref={headerRef}
          className="text-center max-w-3xl mx-auto mb-16 md:mb-20 space-y-4"
          style={{ opacity: 0 }}
        >
          <div className="section-eyebrow justify-center">
            Target Audience
          </div>
          <h2 className="font-display font-semibold text-4xl sm:text-5xl md:text-6xl text-brand-text tracking-tight leading-tight">
            Built For Independent <span className="text-gold-gradient" style={{ fontStyle: 'italic', fontWeight: 400 }}>Creators</span>
          </h2>
          <p className="font-sans text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Whether you are coaching a handful of private students or managing an audience of hundreds of
            thousands, XLChess equips you with enterprise-grade technology.
          </p>
        </div>

        {/* Targets Grid */}
        <div ref={gridRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {targets.map((target, index) => (
            <div
              key={index}
              className="luxury-card p-8 flex flex-col justify-between text-left space-y-6"
              style={{ opacity: 0, borderRadius: '2px' }}
            >
              {/* Chess board micropattern */}
              <div className="card-board-pattern" aria-hidden="true" />

              {/* Coordinate accent */}
              <div className="card-coordinate" aria-hidden="true">{target.coordinate}</div>

              <div className="space-y-4 relative z-10">
                <div className="feature-icon-box">
                  {target.icon}
                </div>
                <h3 className="font-display font-semibold text-xl text-brand-text" style={{ letterSpacing: '-0.01em' }}>
                  {target.title}
                </h3>
                <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                  {target.description}
                </p>
              </div>

              <ul className="space-y-3 pt-4 border-t relative z-10" style={{ borderColor: 'rgba(212, 175, 110, 0.12)' }}>
                {target.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs leading-normal" style={{ color: 'var(--text-secondary)' }}>
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--gold-bright)' }} />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
      <div className="section-divider absolute bottom-0 left-0 right-0" aria-hidden="true" />
    </section>
  );
}
