import { useEffect } from 'react';
import { gsap } from '../utils/gsapConfig';

interface UseMagneticWiggleOptions<T extends HTMLElement, C extends HTMLElement> {
  targetRef: React.RefObject<T | null>;
  containerRef?: React.RefObject<C | null>;
  magneticStrength?: number;
}

export function useMagneticWiggle<T extends HTMLElement, C extends HTMLElement>({
  targetRef,
  containerRef,
  magneticStrength = 0.3,
}: UseMagneticWiggleOptions<T, C>) {
  useEffect(() => {
    const target = targetRef.current;
    const container = containerRef?.current || target;
    
    if (!target || !container) return;

    // 1. Continuous wiggle (rotation and scale only, leaving x/y for the magnetic effect)
    const wiggleTween = gsap.to(target, {
      rotation: 3,
      scale: 1.05,
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    // 2. Mouse move handler: calculate pull towards cursor
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      
      gsap.to(target, {
        x: dx * magneticStrength,
        y: dy * magneticStrength,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto', // only overwrites x and y, leaving rotation/scale alone
      });
    };

    // 3. Mouse leave handler: elastic spring back to center
    const onMouseLeave = () => {
      gsap.to(target, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: 'elastic.out(1, 0.4)',
        overwrite: 'auto',
      });
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);

    return () => {
      wiggleTween.kill();
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
      gsap.killTweensOf(target, 'x,y');
    };
  }, [targetRef, containerRef, magneticStrength]);
}
