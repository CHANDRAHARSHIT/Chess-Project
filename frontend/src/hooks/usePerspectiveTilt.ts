/**
 * usePerspectiveTilt.ts
 *
 * A reusable, TypeScript-typed hook that adds a GSAP-powered cursor-driven
 * 3D perspective tilt to any HTML element.
 *
 * Desktop behaviour (pointer device):
 *   - Tracks mousemove over the element
 *   - Maps cursor offset → rotationX (±maxRotate°) / rotationY (±maxRotate°)
 *   - Uses gsap.quickTo() for buttery-smooth 60 fps interpolation
 *   - Applies scale(scalePeak) + dynamic drop-shadow on hover
 *   - Resets smoothly on mouseleave
 *
 * Mobile / tablet behaviour (no precise pointer):
 *   - Replaces tilt with a subtle translateY yoyo float
 *   - Battery-friendly: only uses CSS composited properties
 *
 * Accessibility:
 *   - Fully respects prefers-reduced-motion
 *   - Returns static element when reduced motion is requested
 *
 * Cleanup:
 *   - All tweens killed via GSAP context on unmount
 *   - Event listeners removed via AbortController (no leaks)
 *
 * Usage:
 *   const tiltRef = usePerspectiveTilt<HTMLDivElement>({ maxRotate: 8 });
 *   <div ref={tiltRef}>...</div>
 */

import { useRef, useLayoutEffect } from 'react';
import { gsap } from '../utils/gsapConfig';
import { prefersReducedMotion } from '../utils/gsapConfig';

// ─── Public API ────────────────────────────────────────────────────────────────

export interface PerspectiveTiltOptions {
  /** Maximum rotation angle in degrees (applied to both axes). Default: 8 */
  maxRotate?: number;
  /** Scale factor at peak hover. Default: 1.02 */
  scalePeak?: number;
  /**
   * quickTo duration (seconds). Lower = snappier, higher = more fluid.
   * This maps to the GSAP quickTo `duration` option.
   * Default: 0.4
   */
  quickToDuration?: number;
  /**
   * quickTo ease string. Default: 'power3.out'
   */
  quickToEase?: string;
  /** Mobile float: translateY distance in px. Default: 8 */
  floatDistance?: number;
  /** Mobile float: full cycle duration in seconds. Default: 3 */
  floatDuration?: number;
  /**
   * When true, suppresses the mobile yoyo float entirely.
   * Use this for elements that should never bounce or pulse (e.g. CTA buttons).
   * Default: false
   */
  disableMobileFloat?: boolean;
  /**
   * Alpha multiplier for the dynamic drop-shadow (0–1).
   * Higher = more vivid glow on hover. Default: 1
   */
  shadowStrength?: number;
  /**
   * When true, freezes the tilt and returns the board to flat identity.
   * Default: false
   */
  paused?: boolean;
}

/**
 * Returns a ref to attach to the element you want to tilt.
 * The hook self-cleans on unmount.
 */
export function usePerspectiveTilt<T extends HTMLElement>(
  options: PerspectiveTiltOptions = {}
) {
  const {
    maxRotate        = 8,
    scalePeak        = 1.02,
    quickToDuration  = 0.4,
    quickToEase      = 'power3.out',
    floatDistance    = 8,
    floatDuration    = 3,
    disableMobileFloat = false,
    shadowStrength   = 1,
    paused           = false,
  } = options;

  const elRef = useRef<T | null>(null);

  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;

    if (paused) {
      const restAlpha = +(0.15 * shadowStrength).toFixed(3);
      gsap.to(el, {
        rotationX: 0,
        rotationY: 0,
        scaleX: 1,
        scaleY: 1,
        filter: `drop-shadow(0 16px 40px rgba(99,102,241,${restAlpha}))`,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      return;
    }

    // ── Accessibility guard ─────────────────────────────────────────────────
    if (prefersReducedMotion()) return;

    // ── Detect device capability ─────────────────────────────────────────────
    // `(hover: hover)` = device has a true hover pointer (mouse / trackpad)
    // Touch screens match `(hover: none)` so they get the float path
    const isPointerDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const ctx = gsap.context(() => {
      // ════════════════════════════════════════════════════════════════════════
      // DESKTOP PATH — cursor-driven perspective tilt
      // ════════════════════════════════════════════════════════════════════════
      if (isPointerDevice) {
        // Seed the element at identity so quickTo has a starting value
        gsap.set(el, { rotationX: 0, rotationY: 0, scaleX: 1, scaleY: 1, transformOrigin: 'center center' });

        // quickTo returns a high-performance setter — call it every mousemove
        const setRotateX = gsap.quickTo(el, 'rotationX', {
          duration: quickToDuration,
          ease: quickToEase,
        });
        const setRotateY = gsap.quickTo(el, 'rotationY', {
          duration: quickToDuration,
          ease: quickToEase,
        });
        const setScaleX = gsap.quickTo(el, 'scaleX', {
          duration: quickToDuration,
          ease: quickToEase,
        });
        const setScaleY = gsap.quickTo(el, 'scaleY', {
          duration: quickToDuration,
          ease: quickToEase,
        });

        // AbortController lets us remove all listeners in one call on cleanup
        const ac = new AbortController();
        const { signal } = ac;

        el.addEventListener(
          'mousemove',
          (e: MouseEvent) => {
            const rect = el.getBoundingClientRect();
            // Normalise cursor to [-1, +1] within the element
            const nx = ((e.clientX - rect.left) / rect.width)  * 2 - 1; // left→right
            const ny = ((e.clientY - rect.top)  / rect.height) * 2 - 1; // top→bottom

            // rotationX: positive ny (cursor near bottom) → tilt top toward viewer
            // rotationY: positive nx (cursor near right)  → tilt right away from viewer
            setRotateX(-ny * maxRotate);
            setRotateY( nx * maxRotate);
            setScaleX(scalePeak);
            setScaleY(scalePeak);

          },
          { signal }
        );

        el.addEventListener(
          'mouseleave',
          () => {
            // Smoothly return to identity
            setRotateX(0);
            setRotateY(0);
            setScaleX(1);
            setScaleY(1);
          },
          { signal }
        );

        // Store abort controller on the context so we can call it in cleanup
        return () => ac.abort();
      }

      // ════════════════════════════════════════════════════════════════════════
      // MOBILE / TABLET PATH — gentle floating animation (battery-friendly)
      // Skipped when disableMobileFloat is true (e.g. CTA buttons).
      // ════════════════════════════════════════════════════════════════════════
      if (!disableMobileFloat) {
        gsap.to(el, {
          y: -floatDistance,
          duration: floatDuration,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }
    }); // end gsap.context

    return () => {
      ctx.revert(); // kills all tweens + calls any returned cleanup fns
    };
  }, [maxRotate, scalePeak, quickToDuration, quickToEase, floatDistance, floatDuration, disableMobileFloat, shadowStrength, paused]);

  return elRef;
}
