/**
 * BuiltFor.tsx  ("Built For Independent Creators")
 * ScrollTrigger animations:
 *   - Header: fade-up
 *   - Target cards: staggered reveal (0.12s between)
 */

import { useRef } from 'react';
import { UserCheck, Video, School, CheckCircle2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function BuiltFor() {
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef   = useRef<HTMLDivElement>(null);

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
      icon: <UserCheck className="w-6 h-6 text-brand-accent" />,
      title: 'Chess Coaches',
      description:
        'Upgrade from Google Drive folders and messy chat logs. Keep students accountable with structured learning modules.',
      bullets: [
        'Organize custom exercises and puzzle homework',
        "Analyze students' games using built-in engine logs",
        'Direct billing and subscription management',
      ],
    },
    {
      icon: <Video className="w-6 h-6 text-brand-accent" />,
      title: 'Chess YouTubers',
      description:
        'Stop sending your hard-earned traffic to massive platforms that monetize your audience. Retain community value.',
      bullets: [
        'Offer subscriber-only opening preparation databases',
        'Host community tournaments and live streams',
        'Launch branded educational digital products',
      ],
    },
    {
      icon: <School className="w-6 h-6 text-brand-accent" />,
      title: 'Chess Academies',
      description:
        'Standardize operations and curriculum across multiple coaches. Maintain oversight on player progression.',
      bullets: [
        'Centralized dashboard for tracking students rating growth',
        'Standardized opening databases and training syllabus',
        'Multi-coach calendar booking and scheduling tools',
      ],
    },
  ];

  return (
    <section id="built-for" className="py-20 md:py-28 bg-brand-bg border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div
          ref={headerRef}
          className="text-center max-w-3xl mx-auto mb-16 md:mb-20 space-y-4"
          style={{ opacity: 0 }}
        >
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            Built For Independent Creators
          </h2>
          <p className="font-sans text-brand-secondary text-base leading-relaxed">
            Whether you are coaching a handful of private students or managing an audience of hundreds of
            thousands, ChessCraft equips you with enterprise-grade technology.
          </p>
        </div>

        {/* Targets Grid */}
        <div ref={gridRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {targets.map((target, index) => (
            <div
              key={index}
              className="p-8 rounded-xl bg-brand-surface border border-brand-border flex flex-col justify-between text-left space-y-6 hover:border-brand-accent/20 transition-all duration-300"
              style={{ opacity: 0 }}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-brand-bg border border-brand-border flex items-center justify-center">
                  {target.icon}
                </div>
                <h3 className="font-sans font-bold text-xl text-white">{target.title}</h3>
                <p className="font-sans text-sm text-brand-secondary leading-relaxed">
                  {target.description}
                </p>
              </div>

              <ul className="space-y-3 pt-4 border-t border-brand-border/60">
                {target.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-brand-secondary leading-normal">
                    <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
