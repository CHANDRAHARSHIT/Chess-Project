import { useEffect } from 'react';
import { gsap } from '@/utils/gsapConfig';

interface UseMagneticButtonOptions<T extends HTMLElement, C extends HTMLElement> {
  targetRef: React.RefObject<T | null>;
  containerRef?: React.RefObject<C | null>;
  magneticStrength?: number;
}

export function useMagneticButton<T extends HTMLElement, C extends HTMLElement>({
  targetRef,
  containerRef,
  magneticStrength = 1,
}: UseMagneticButtonOptions<T, C>) {
  useEffect(() => {
    const target = targetRef.current;
    const container = containerRef?.current || target;

    if (!target || !container) return;

    // Device capability detection: only run magnetic tracking on pointer devices with fine control
    const isPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isPointer) {
      gsap.set(target, { x: 0, y: 0 });
      return;
    }

    let rect: DOMRect | null = null;
    let targetRect: DOMRect | null = null;
    let defaultLeft = 0;
    let defaultTop = 0;

    const onMouseEnter = () => {
      rect = container.getBoundingClientRect();
      targetRect = target.getBoundingClientRect();
      
      const currentX = parseFloat(gsap.getProperty(target, 'x') as string) || 0;
      const currentY = parseFloat(gsap.getProperty(target, 'y') as string) || 0;
      
      defaultLeft = targetRect.left - rect.left - currentX;
      defaultTop = targetRect.top - rect.top - currentY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!rect || !targetRect) {
        onMouseEnter();
      }

      // Safe fallback check
      if (!rect || !targetRect) return;

      const targetWidth = target.offsetWidth || targetRect.width;
      const targetHeight = target.offsetHeight || targetRect.height;

      // Normalize mouse coordinates relative to the button container [0, 1]
      const normX = gsap.utils.clamp(0, 1, (e.clientX - rect.left) / rect.width);
      const normY = gsap.utils.clamp(0, 1, (e.clientY - rect.top) / rect.height);

      // Centering offset (offset needed to place the emoji exactly at the center of the button)
      const offsetCenterX = (rect.width - targetWidth) / 2 - defaultLeft;
      const offsetCenterY = (rect.height - targetHeight) / 2 - defaultTop;

      // The image element is 62x62, but the visual chess piece inside the PNG is smaller (has 16px transparent padding on all sides).
      const imgPadding = 16;
      const visualWidth = targetWidth - 2 * imgPadding;
      const visualHeight = targetHeight - 2 * imgPadding;

      // Target padding between the visual emoji and button boundaries
      const edgePadding = 0;

      // Calculate maximum allowed symmetric translations from the centered position
      const maxX = (rect.width - visualWidth) / 2 - edgePadding;
      const maxY = (rect.height - visualHeight) / 2 - edgePadding;

      // Translate the normalized coordinate [-0.5, 0.5] range to [-maxX, maxX]
      const transX = (normX - 0.5) * 2 * maxX;
      const transY = (normY - 0.5) * 2 * maxY;

      // Final translation including centering offset and scaling with magnetic strength
      const moveX = offsetCenterX + transX * magneticStrength;
      const moveY = offsetCenterY + transY * magneticStrength;

      gsap.to(target, {
        x: moveX+1,
        y: moveY+1,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: true,
      });
    };

    const resetPosition = () => {
      rect = null;
      targetRect = null;
      gsap.to(target, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: 'elastic.out(1, 0.3)',
        overwrite: true,
      });
    };

    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', resetPosition);
    container.addEventListener('pointerleave', resetPosition);
    container.addEventListener('touchcancel', resetPosition);

    return () => {
      container.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', resetPosition);
      container.removeEventListener('pointerleave', resetPosition);
      container.removeEventListener('touchcancel', resetPosition);
      gsap.killTweensOf(target, 'x,y');
      gsap.set(target, { x: 0, y: 0 });
    };
  }, [targetRef, containerRef, magneticStrength]);
}
