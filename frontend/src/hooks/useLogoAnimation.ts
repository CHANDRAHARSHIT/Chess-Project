/**
 * useLogoAnimation.ts
 *
 * Premium GSAP-powered logo animation using gsap.utils.interpolate() and quickTo().
 *
 * Desktop (pointer device):
 *   ① Continuous subtle float: translateY -4px yoyo, 3s, sine.inOut, infinite
 *   ② Cursor tracking: mousemove inside logo container drives rotateX / rotateY
 *      via gsap.utils.interpolate() — maps normalised [0,1] cursor offset to [-10,10]deg
 *   ③ quickTo() for rotateX, rotateY, scale, brightness — all at 60fps
 *   ④ Hover energy: scale(1.08) + brightness(1.15) + deeper shadow on mouseenter
 *   ⑤ Dance / wobble on fast moves: velocity tracked, overshoot injected via
 *      a small elastic kick when velocity exceeds threshold
 *   ⑥ Natural spring-back: all quickTo setters return to rest on mouseleave
 *
 * Mobile / tablet (hover: none):
 *   - Float only: translateY -4px yoyo (same sine.inOut, 3s)
 *   - Periodic scale pulse (1→1.04→1) every 5s, elastic ease
 *   - No 3D rotation or mouse tracking
 *
 * Accessibility:
 *   - prefersReducedMotion() guard: exits immediately → fully static logo
 *
 * Performance:
 *   - quickTo() — no per-frame allocations, GSAP ticks on RAF
 *   - AbortController — zero-leak event removal
 *   - gsap.context() — automatic tween cleanup on unmount
 *
 * Usage:
 *   const { containerRef, logoRef } = useLogoAnimation();
 *   <div ref={containerRef}><img ref={logoRef} ... /></div>
 */

import { useRef, useLayoutEffect } from 'react';
import { gsap } from '../utils/gsapConfig';
import { prefersReducedMotion } from '../utils/gsapConfig';

// ─── Returned refs ────────────────────────────────────────────────────────────
export interface LogoAnimationRefs {
  /** Attach to the wrapper element that receives mouse events */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Attach to the <img> that gets the visual transforms */
  logoRef: React.RefObject<HTMLImageElement | null>;
}

// ─── Tuning constants ─────────────────────────────────────────────────────────
const MAX_ROTATE        = 6;    // degrees — rotateX and rotateY cap
const SCALE_HOVER       = 1.03;
const SCALE_REST        = 1;
const FLOAT_DISTANCE    = 4;    // px — subtle float amplitude
const FLOAT_DURATION    = 3;    // seconds
const QUICK_DURATION    = 0.45; // quickTo response time (lower = snappier)
const QUICK_EASE        = 'power3.out';
const VELOCITY_THRESH   = 250;  // px/s — above this triggers dance wobble
const WOBBLE_KICK       = 3;    // extra degrees injected as overshoot

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useLogoAnimation(): LogoAnimationRefs {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const logoRef      = useRef<HTMLImageElement | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const logo      = logoRef.current;
    if (!container || !logo) return;

    // Accessibility guard — fully static logo, zero animations
    if (prefersReducedMotion()) return;

    // ── Device capability detection ─────────────────────────────────────────
    const isPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // ── GSAP context (auto-kill on unmount) ─────────────────────────────────
    const ctx = gsap.context(() => {

      // Seed transform origin
      gsap.set(logo, { transformOrigin: 'center center', transformPerspective: 600 });

      // ════════════════════════════════════════════════════════════════════
      // ① FLOAT — runs on both desktop and mobile (different amplitudes)
      // ════════════════════════════════════════════════════════════════════
      const floatTween = gsap.to(logo, {
        y: -FLOAT_DISTANCE,
        duration: FLOAT_DURATION,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      // ════════════════════════════════════════════════════════════════════
      // MOBILE PATH — float + periodic scale pulse
      // ════════════════════════════════════════════════════════════════════
      if (!isPointer) {
        // Scale pulse every 5 seconds — subtle, battery-friendly
        const pulseTween = gsap.to(logo, {
          scaleX: 1.04,
          scaleY: 1.04,
          duration: 0.5,
          ease: 'elastic.out(1, 0.5)',
          repeat: -1,
          repeatDelay: 4.5,
          yoyo: true,
        });

        return () => {
          floatTween.kill();
          pulseTween.kill();
        };
      }

      // ════════════════════════════════════════════════════════════════════
      // DESKTOP PATH
      // ════════════════════════════════════════════════════════════════════

      // ── gsap.utils.interpolate() setters ───────────────────────────────
      // Maps a progress value [0 → 1] to the rotation range
      const rotateYInterp = gsap.utils.interpolate(-MAX_ROTATE, MAX_ROTATE);
      const rotateXInterp = gsap.utils.interpolate(MAX_ROTATE, -MAX_ROTATE); // inverted: top→tilt back

      // ── quickTo setters for silky 60fps ────────────────────────────────
      const setRotateX  = gsap.quickTo(logo, 'rotateX', { duration: QUICK_DURATION, ease: QUICK_EASE });
      const setRotateY  = gsap.quickTo(logo, 'rotateY', { duration: QUICK_DURATION, ease: QUICK_EASE });
      const setScaleX   = gsap.quickTo(logo, 'scaleX',  { duration: 0.35,           ease: 'back.out(2)' });
      const setScaleY   = gsap.quickTo(logo, 'scaleY',  { duration: 0.35,           ease: 'back.out(2)' });
      const setBrightness = (val: number) =>
        gsap.to(logo, { filter: `brightness(${val}) drop-shadow(0 0 ${val > 1 ? 10 : 0}px rgba(99,102,241,${val > 1 ? 0.45 : 0}))`, duration: 0.3, overwrite: 'auto' });

      // ── Velocity tracking for dance effect ─────────────────────────────
      let lastX = 0, lastY = 0, lastTime = 0;
      let wobbleTimeout: ReturnType<typeof setTimeout> | null = null;

      // ── AbortController for leak-free cleanup ──────────────────────────
      const ac = new AbortController();
      const { signal } = ac;

      // ── mousemove: cursor tracking + dance kick ─────────────────────────
      container.addEventListener('mousemove', (e: MouseEvent) => {
        const rect   = container.getBoundingClientRect();

        // Normalise cursor to [0, 1] within the container
        const nx = (e.clientX - rect.left)  / rect.width;   // 0=left, 1=right
        const ny = (e.clientY - rect.top)   / rect.height;  // 0=top,  1=bottom

        // Map through interpolate() — organic, not raw offset
        const targetRotateY = rotateYInterp(nx);
        const targetRotateX = rotateXInterp(ny);

        // ── Velocity check for dance wobble ──────────────────────────────
        const now  = performance.now();
        const dt   = (now - lastTime) / 1000; // seconds
        if (dt > 0 && lastTime > 0) {
          const vx = Math.abs(e.clientX - lastX) / dt;
          const vy = Math.abs(e.clientY - lastY) / dt;
          const velocity = Math.sqrt(vx * vx + vy * vy);

          if (velocity > VELOCITY_THRESH) {
            // Inject a small overshoot kick — feels premium, not cartoonish
            const kickX = targetRotateX + (ny < 0.5 ? -WOBBLE_KICK : WOBBLE_KICK);
            const kickY = targetRotateY + (nx < 0.5 ? -WOBBLE_KICK : WOBBLE_KICK);

            gsap.to(logo, {
              rotateX: kickX,
              rotateY: kickY,
              duration: 0.12,
              ease: 'power1.out',
              overwrite: 'auto',
              onComplete: () => {
                // Spring back to cursor position after kick
                setRotateX(targetRotateX);
                setRotateY(targetRotateY);
              },
            });

            // Auto-settle: clear any pending wobble reset
            if (wobbleTimeout) clearTimeout(wobbleTimeout);
            wobbleTimeout = setTimeout(() => {
              setRotateX(targetRotateX);
              setRotateY(targetRotateY);
            }, 180);
          } else {
            // Normal smooth tracking
            setRotateX(targetRotateX);
            setRotateY(targetRotateY);
          }
        } else {
          setRotateX(targetRotateX);
          setRotateY(targetRotateY);
        }

        lastX = e.clientX;
        lastY = e.clientY;
        lastTime = now;
      }, { signal });

      // ── mouseenter: hover energy boost ────────────────────────────────
      container.addEventListener('mouseenter', () => {
        setScaleX(SCALE_HOVER);
        setScaleY(SCALE_HOVER);
        setBrightness(1.15);
        // Pause float briefly so it doesn't fight the scale
        floatTween.timeScale(0.4);
      }, { signal });

      // ── mouseleave: spring back to rest ───────────────────────────────
      container.addEventListener('mouseleave', () => {
        setRotateX(0);
        setRotateY(0);
        setScaleX(SCALE_REST);
        setScaleY(SCALE_REST);
        setBrightness(1);
        floatTween.timeScale(1); // restore float speed
        lastTime = 0; // reset velocity tracking
        if (wobbleTimeout) { clearTimeout(wobbleTimeout); wobbleTimeout = null; }
      }, { signal });

      // ── Cleanup ───────────────────────────────────────────────────────
      return () => {
        ac.abort();
        if (wobbleTimeout) clearTimeout(wobbleTimeout);
      };

    }); // end gsap.context

    return () => { ctx.revert(); };

  }, []); // runs once on mount

  return { containerRef, logoRef };
}
