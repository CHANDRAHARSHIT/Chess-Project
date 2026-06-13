/**
 * HowItWorks.tsx
 * ScrollTrigger animations:
 *   - Header: fade-up
 *   - Step cards: sequential stagger (left-to-right, 0.15s between)
 */

import { useRef } from 'react';
import { Palette, Cpu, Rocket } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function HowItWorks() {
  const headerRef = useRef<HTMLDivElement>(null);
  const stepsRef  = useRef<HTMLDivElement>(null);

  // Header fade-up
  useScrollReveal(headerRef as React.RefObject<Element | null>, { y: 50, duration: 0.8 });

  // Steps stagger reveal
  useScrollReveal(stepsRef as React.RefObject<Element | null>, {
    selector: ':scope > div',
    y: 55,
    stagger: 0.15,
    duration: 0.75,
    start: 'top 85%',
  });

  const steps = [
    {
      num: '01',
      icon: <Palette className="w-5 h-5 text-brand-accent" />,
      title: 'Choose Your Brand',
      description:
        'Upload your organization logos, configure color palettes matching your academy colors, and connect your custom domain name (e.g. academy.yourname.com).',
    },
    {
      num: '02',
      icon: <Cpu className="w-5 h-5 text-brand-accent" />,
      title: 'Configure Learning Experience',
      description:
        'Upload video lectures, create interactive puzzle challenges, compile coordinate practice worksheets, and set up customizable subscriber tier access.',
    },
    {
      num: '03',
      icon: <Rocket className="w-5 h-5 text-brand-accent" />,
      title: 'Launch To Audience',
      description:
        'Embed the signup links directly into your streaming descriptions, email newsletters, or website. Instantly invite students to join your owned ecosystem.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-brand-surface border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div
          ref={headerRef}
          className="text-center max-w-3xl mx-auto mb-16 md:mb-20 space-y-4"
          style={{ opacity: 0 }}
        >
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            How It Works
          </h2>
          <p className="font-sans text-brand-secondary text-base leading-relaxed">
            Going independent does not require code or hosting setups.{' '}
            Our automated pipeline delivers a production-ready academy portal in three simple steps.
          </p>
        </div>

        {/* Steps Grid */}
        <div ref={stepsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">

          {/* Connecting line (Desktop only) */}
          <div className="hidden lg:block absolute top-1/2 left-4 right-4 h-0.5 bg-gradient-to-r from-brand-border via-brand-border to-brand-bg -translate-y-12 z-0" />

          {steps.map((step, index) => (
            <div
              key={index}
              className="relative z-10 flex flex-col items-start text-left space-y-4 p-6 bg-brand-bg rounded-xl border border-brand-border hover:border-brand-accent/20 transition-all duration-300"
              style={{ opacity: 0 }}
            >
              {/* Top Row with Number and Icon */}
              <div className="flex items-center justify-between w-full">
                <div className="w-10 h-10 rounded-lg bg-brand-surface border border-brand-border flex items-center justify-center">
                  {step.icon}
                </div>
                <span className="font-mono text-3xl font-extrabold text-brand-secondary/20 tracking-wider">
                  {step.num}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="font-sans font-bold text-lg text-white pt-2">{step.title}</h3>
              <p className="font-sans text-sm text-brand-secondary leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
