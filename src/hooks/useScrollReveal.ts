/**
 * useScrollReveal.ts
 * Applies a "fade-up" ScrollTrigger reveal to one or more elements.
 *
 * Usage:
 *   const sectionRef = useRef<HTMLElement>(null);
 *   useScrollReveal(sectionRef);                         // single element
 *   useScrollReveal(sectionRef, '.card', { stagger: 0.1 }); // children with stagger
 */

import { useRef, type RefObject } from 'react';
import { gsap, ScrollTrigger, dur, ease } from '../utils/gsapConfig';
import { useGSAP } from './useGSAP';

export interface ScrollRevealOptions {
  /** Selector string for child elements (uses the scopeRef as scope). Leave empty to animate the container itself. */
  selector?: string;
  /** Y-axis start offset in px. Default: 60 */
  y?: number;
  /** Animation duration in seconds. Default: 0.8 */
  duration?: number;
  /** Stagger delay between children in seconds. Default: 0 */
  stagger?: number;
  /** ScrollTrigger start string. Default: 'top 88%' */
  start?: string;
  /** Extra delay before the animation begins. Default: 0 */
  delay?: number;
}

/**
 * Attaches a ScrollTrigger-based fade-up reveal to `scopeRef`.
 * Automatically kills the trigger on unmount.
 */
export function useScrollReveal(
  scopeRef: RefObject<Element | null>,
  options: ScrollRevealOptions = {}
) {
  const {
    selector,
    y = 60,
    duration = 0.8,
    stagger = 0,
    start = 'top 88%',
    delay = 0,
  } = options;

  const triggerRef = useRef<ScrollTrigger | null>(null);

  useGSAP(
    () => {
      if (!scopeRef.current) return;

      // Targets: either child selector or the container itself
      const targets = selector
        ? gsap.utils.toArray<Element>(scopeRef.current.querySelectorAll(selector))
        : [scopeRef.current];

      if (!targets.length) return;

      // Set initial hidden state immediately (prevents flash before trigger fires)
      gsap.set(targets, { opacity: 0, y });

      const tween = gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: dur(duration),
        delay,
        stagger,
        ease: ease.out,
        clearProps: 'will-change',
        scrollTrigger: {
          trigger: scopeRef.current,
          start,
          toggleActions: 'play none none none',
          // Store trigger ref for manual kill if needed
          onEnter: (self) => { triggerRef.current = self; },
        },
      });

      return () => {
        tween.kill();
      };
    },
    scopeRef,
    []
  );

  return triggerRef;
}
