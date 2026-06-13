/**
 * Hero.tsx
 * Landing hero section with premium GSAP animations:
 *
 * Animations:
 *   ① Headline lines — staggered fade-up (y:40→0, opacity:0→1, 0.8s each, 0.15s stagger)
 *   ② Subtitle + CTA buttons — fade-up after headline (back.out spring)
 *   ③ Chessboard container — slide from right (x:80→0) + fade, 1.2s, slight rotation correction
 *   ④ Chessboard float — mobile only: infinite y:-8px yoyo (handled by usePerspectiveTilt)
 *   ⑤ Background orbs — CSS keyframe float (no GSAP, pure composited GPU layer)
 *   ⑥ Perspective tilt — desktop: cursor-driven 3D tilt via usePerspectiveTilt hook
 */

import { useState, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { ArrowRight } from 'lucide-react';
import { useGSAP } from '../hooks/useGSAP';
import { usePerspectiveTilt } from '../hooks/usePerspectiveTilt';
import { gsap, dur, ease } from '../utils/gsapConfig';

export default function Hero() {
  // ── Chess logic (unchanged) ──────────────────────────────────────────────
  const gameRef = useRef(new Chess());
  const [gameFen, setGameFen] = useState(() => gameRef.current.fen());

  function makeAMove(move: Parameters<Chess['move']>[0]) {
    try {
      const result = gameRef.current.move(move);
      setGameFen(gameRef.current.fen());
      return result;
    } catch {
      return null;
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string | null) {
    if (!targetSquare) return false;
    const move = makeAMove({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (move === null) return false;

    setTimeout(() => {
      const game = gameRef.current;
      const possibleMoves = game.moves();
      if (!game.isGameOver() && possibleMoves.length > 0) {
        makeAMove(possibleMoves[Math.floor(Math.random() * possibleMoves.length)]);
      }
    }, 450);

    return true;
  }

  // ── Animation refs ────────────────────────────────────────────────────────
  const heroRef     = useRef<HTMLElement>(null);
  const line1Ref    = useRef<HTMLSpanElement>(null);
  const line2Ref    = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef      = useRef<HTMLDivElement>(null);
  const boardColRef = useRef<HTMLDivElement>(null);

  // ── Perspective tilt hook (manages its own ref) ────────────────────────────
  // Desktop: cursor-driven 3D tilt + shadow
  // Mobile:  gentle translateY float (replaces old unconditional float)
  const tiltRef = usePerspectiveTilt<HTMLDivElement>({
    maxRotate:       8,
    scalePeak:       1.02,
    quickToDuration: 0.4,
    quickToEase:     'power3.out',
    floatDistance:   8,
    floatDuration:   3,
  });

  // ── GSAP entrance animations ───────────────────────────────────────────────
  useGSAP(
    () => {
      if (!heroRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: ease.out } });

      // ① Headline lines — staggered fade-up
      tl.fromTo(
        [line1Ref.current, line2Ref.current],
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: dur(0.8), stagger: 0.15 }
      );

      // ② Subtitle → fade up, then CTA buttons spring in
      tl.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: dur(0.6) },
        '-=0.4'
      );

      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 20, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: dur(0.5), ease: ease.spring },
        '-=0.3'
      );

      // ③ Chessboard column — slide from right + rotation correction
      tl.fromTo(
        boardColRef.current,
        { opacity: 0, x: 80, rotation: -3 },
        { opacity: 1, x: 0, rotation: 0, duration: dur(1.2), ease: 'power2.out' },
        0.2  // starts 0.2s after timeline start (parallel with headline)
      );

      // NOTE: Float animation (④) is now handled by usePerspectiveTilt hook.
      // Desktop → tilt effect (no float). Mobile → gentle translateY yoyo.
    },
    heroRef,
    []
  );

  return (
    <header
      ref={heroRef}
      className="relative pt-24 pb-16 md:pt-36 md:pb-28 overflow-hidden bg-brand-bg"
    >
      {/* ── Background glow orbs (CSS animated — GPU composited) ─────────── */}
      <div
        className="hero-orb-a absolute top-1/4 left-1/2 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="hero-orb-b absolute top-10 right-10 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[90px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* ── Text Column ────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 space-y-6 md:space-y-8 text-left">
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.1] md:leading-[1.05]">
              {/* Each span is a separate animation target */}
              <span ref={line1Ref} className="block" style={{ opacity: 0 }}>
                Build the Chess Platform
              </span>
              <span
                ref={line2Ref}
                className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-accent via-indigo-400 to-violet-400"
                style={{ opacity: 0 }}
              >
                Your Audience Deserves
              </span>
            </h1>

            <p
              ref={subtitleRef}
              className="font-sans text-base sm:text-lg text-brand-secondary max-w-xl leading-relaxed"
              style={{ opacity: 0 }}
            >
              A creator-owned chess platform where you own the brand, community, and upside.
            </p>

            {/* CTA Buttons */}
            <div
              ref={ctaRef}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
              style={{ opacity: 0 }}
            >
              {/* Primary CTA — glow pulse via btn-glow CSS class */}
              <a
                href="#interactive-demo"
                id="hero-cta-primary"
                className="
                  btn-glow
                  inline-flex items-center justify-center gap-2
                  font-sans font-semibold text-sm
                  bg-brand-accent hover:bg-brand-accent/95 text-white
                  px-6 py-3.5 rounded-lg
                  transition-all duration-200
                  shadow-xl shadow-brand-accent/20
                  hover:scale-[1.05] active:scale-[0.97]
                "
              >
                Play Demo
                <ArrowRight className="w-4 h-4" />
              </a>

              {/* Secondary CTA */}
              <a
                href="#partner-cta"
                id="hero-cta-secondary"
                className="
                  inline-flex items-center justify-center gap-2
                  font-sans font-semibold text-sm
                  bg-brand-surface hover:bg-brand-surface/80
                  border border-brand-border text-brand-secondary hover:text-white
                  px-6 py-3.5 rounded-lg
                  transition-all duration-200
                  hover:scale-[1.05] active:scale-[0.97]
                  hover:border-brand-accent/30
                "
              >
                Become a Partner
              </a>
            </div>
          </div>

          {/* ── Chessboard Column ──────────────────────────────────────────── */}
          {/*
            perspective is set on the PARENT so 3D child transforms render correctly.
            transformStyle: preserve-3d propagates depth through nested elements.
          */}
          <div
            ref={boardColRef}
            className="lg:col-span-6 flex justify-center"
            style={{
              opacity: 0,
              perspective: '1000px',
            }}
          >
            {/*
              tiltRef is attached here — usePerspectiveTilt owns:
                Desktop: rotateX/Y + scale + dynamic shadow via mousemove
                Mobile:  translateY yoyo float
              CSS transition removed from this wrapper (GSAP handles everything).
            */}
            <div
              ref={tiltRef}
              className="w-full max-w-[440px] md:max-w-[480px]"
              style={{
                transformStyle: 'preserve-3d',
                willChange: 'transform, filter',
              }}
            >
              <div
                className="bg-brand-surface border border-brand-border rounded-xl shadow-2xl overflow-hidden"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Board Area */}
                <div className="p-4 bg-brand-surface">
                  <div className="aspect-square rounded-lg overflow-hidden">
                    <Chessboard
                      options={{
                        position: gameFen,
                        onPieceDrop: ({ sourceSquare, targetSquare }) =>
                          onDrop(sourceSquare, targetSquare),
                        darkSquareStyle:  { backgroundColor: '#b58863' },
                        lightSquareStyle: { backgroundColor: '#f0d9b5' },
                        boardStyle: {
                          borderRadius: '4px',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
