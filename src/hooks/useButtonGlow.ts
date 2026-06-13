import { useRef, useLayoutEffect } from 'react';
import { gsap } from '../utils/gsapConfig';
import { prefersReducedMotion } from '../utils/gsapConfig';

/**
 * useButtonGlow
 * Reusable React hook that drives an interactive, cursor-tracking radial glow on a button.
 *
 * Desktop (pointer device):
 *   - Mouse movement is mapped through gsap.utils.interpolate() to set CSS custom properties
 *     --glow-x and --glow-y corresponding to coordinates inside the button.
 *   - gsap.quickTo() ensures smooth, lag-free rendering at 60 FPS.
 *   - --glow-opacity is animated to 1 on hover, and returns to 0 (with smooth centering) on leave.
 *
 * Mobile (touch device):
 *   - Continuous gentle scale breathing + ambient glow pulse loop instead of hover tracking.
 *
 * Accessibility:
 *   - Respects prefers-reduced-motion.
 */
export function useButtonGlow<T extends HTMLElement>() {
  const buttonRef = useRef<T | null>(null);

  useLayoutEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    if (prefersReducedMotion()) return;

    const isPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const ctx = gsap.context(() => {
      // Set initial properties so they are defined
      gsap.set(btn, {
        '--glow-x': '50%',
        '--glow-y': '50%',
        '--glow-opacity': 0,
      });

      if (!isPointer) {
        // Mobile / touch fallback: slow breathing scale and ambient glow loop
        const breathingScale = gsap.to(btn, {
          scale: 1.02,
          duration: 2.2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });

        const breathingGlow = gsap.to(btn, {
          '--glow-opacity': 0.35,
          duration: 1.8,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });

        return () => {
          breathingScale.kill();
          breathingGlow.kill();
        };
      }

      // Desktop/Pointer path: cursor-driven hover glow tracking
      const quickX = gsap.quickTo(btn, '--glow-x', {
        duration: 0.18,
        ease: 'power2.out',
        valueTemplate: (v: string | number) => `${v}%`,
      });

      const quickY = gsap.quickTo(btn, '--glow-y', {
        duration: 0.18,
        ease: 'power2.out',
        valueTemplate: (v: string | number) => `${v}%`,
      });

      const setOpacity = (val: number) => {
        gsap.to(btn, {
          '--glow-opacity': val,
          duration: 0.3,
          ease: 'power1.out',
          overwrite: 'auto',
        });
      };

      const ac = new AbortController();
      const { signal } = ac;

      btn.addEventListener(
        'mousemove',
        (e: MouseEvent) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // Map relative offset [0, 1] to percentages [0, 100] using gsap.utils.interpolate
          const interpX = gsap.utils.interpolate(0, 100);
          const interpY = gsap.utils.interpolate(0, 100);

          const targetX = interpX(x / rect.width);
          const targetY = interpY(y / rect.height);

          quickX(targetX);
          quickY(targetY);
        },
        { signal }
      );

      btn.addEventListener(
        'mouseenter',
        () => {
          setOpacity(1);
        },
        { signal }
      );

      btn.addEventListener(
        'mouseleave',
        () => {
          setOpacity(0);
          // Return smoothly to center position
          quickX(50);
          quickY(50);
        },
        { signal }
      );

      return () => {
        ac.abort();
      };
    });

    return () => {
      ctx.revert();
    };
  }, []);

  return buttonRef;
}
