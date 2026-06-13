/**
 * gsapConfig.ts
 * Central GSAP setup: registers all free-tier plugins and exports helpers.
 * Import this ONCE at the app root before any animation code runs.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register free-tier plugins globally — safe to call multiple times
gsap.registerPlugin(ScrollTrigger);

/**
 * Returns true when the user has requested reduced motion.
 * Use this to skip or minimise animations for accessibility.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Shared easing presets used across the site for consistency.
 */
export const ease = {
  out: 'power2.out',
  inOut: 'power2.inOut',
  spring: 'back.out(1.4)',
  smooth: 'sine.inOut',
} as const;

/**
 * Duration multiplier — returns 0 when user prefers reduced motion
 * so animations snap instantly without removing them from the DOM flow.
 */
export function dur(seconds: number): number {
  return prefersReducedMotion() ? 0 : seconds;
}

export { gsap, ScrollTrigger };
