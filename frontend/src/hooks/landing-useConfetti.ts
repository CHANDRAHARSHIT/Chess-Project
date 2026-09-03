import { useCallback } from 'react';
import confetti from 'canvas-confetti';
import { prefersReducedMotion } from '@/lib/gsapConfig';

export function useConfetti() {
  const fireConfetti = useCallback(() => {
    if (prefersReducedMotion()) return;
    
    // Confetti should cover only the hero section
    const heroSection = document.getElementById('hero-section') || document.querySelector('header');
    if (!heroSection) return;

    // Create a temporary canvas scoped to the hero section
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '50';
    heroSection.appendChild(canvas);

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    const duration = 2000; // 2 seconds
    const end = Date.now() + duration;
    const colors = ['#FFD700', '#8B5CF6', '#FFFFFF'];

    (function frame() {
      myConfetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      myConfetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      } else {
        // Allow particles to clear naturally before removing canvas
        setTimeout(() => {
          if (canvas.parentNode === heroSection) {
            heroSection.removeChild(canvas);
          }
        }, 5000);
      }
    }());
  }, []);

  return { fireConfetti };
}
