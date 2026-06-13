/**
 * useNavbarAnimation.ts
 * Handles two navbar behaviours:
 *   1. Initial fade-down entrance on page load.
 *   2. Hide on scroll-down / show on scroll-up (SaaS standard).
 *
 * Usage:
 *   const navRef = useRef<HTMLElement>(null);
 *   useNavbarAnimation(navRef);
 */

import { type RefObject } from 'react';
import { gsap, ScrollTrigger, dur, ease } from '../utils/gsapConfig';
import { useGSAP } from './useGSAP';

export function useNavbarAnimation(navRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (!navRef.current) return;

      const nav = navRef.current;

      // ── 1. Entrance: fade down from y -30 on page load ──────────────────
      gsap.fromTo(
        nav,
        { y: -30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: dur(0.6),
          ease: ease.out,
          clearProps: 'transform,opacity',
        }
      );

      // ── 2. Hide / Show on scroll direction ───────────────────────────────
      let lastScrollY = window.scrollY;
      let isHidden = false;

      const onScroll = () => {
        const currentY = window.scrollY;
        const diff = currentY - lastScrollY;

        // Only trigger after scrolling past the navbar height
        if (currentY < 80) {
          if (isHidden) showNav();
          lastScrollY = currentY;
          return;
        }

        if (diff > 4 && !isHidden) {
          // Scrolling DOWN → hide
          hideNav();
        } else if (diff < -4 && isHidden) {
          // Scrolling UP → show
          showNav();
        }

        lastScrollY = currentY;
      };

      function hideNav() {
        isHidden = true;
        gsap.to(nav, {
          y: -100,
          opacity: 0,
          duration: dur(0.4),
          ease: ease.inOut,
        });
      }

      function showNav() {
        isHidden = false;
        gsap.to(nav, {
          y: 0,
          opacity: 1,
          duration: dur(0.4),
          ease: ease.out,
        });
      }

      window.addEventListener('scroll', onScroll, { passive: true });

      // Cleanup scroll listener when context reverts
      return () => {
        window.removeEventListener('scroll', onScroll);
        ScrollTrigger.getAll().forEach((t) => t.kill());
      };
    },
    navRef,
    []
  );
}
