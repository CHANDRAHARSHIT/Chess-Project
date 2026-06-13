/**
 * useGSAP.ts
 * A context-safe React hook that wraps gsap.context() for automatic cleanup.
 * Mirrors the behaviour of the official @gsap/react package but without the dependency.
 *
 * Usage:
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   useGSAP((ctx) => {
 *     ctx.add(() => gsap.from('.my-el', { opacity: 0 }));
 *   }, containerRef);
 */

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { gsap } from '../utils/gsapConfig';

type GSAPContextCallback = (ctx: gsap.Context) => void;

// Use useLayoutEffect on the client, useEffect on the server (SSR-safe)
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Runs GSAP animations inside a scoped context tied to `scopeRef`.
 * All ScrollTriggers and tweens created inside `callback` are automatically
 * killed when the component unmounts (no memory leaks).
 *
 * @param callback  - Function receiving a GSAP Context. Define animations here.
 * @param scopeRef  - A ref to the root DOM element that scopes class selectors.
 * @param deps      - Optional dependency array (re-runs animations when deps change).
 */
export function useGSAP(
  callback: GSAPContextCallback,
  scopeRef?: RefObject<Element | null>,
  deps: React.DependencyList = []
) {
  const ctxRef = useRef<gsap.Context | null>(null);

  useIsomorphicLayoutEffect(() => {
    // Create a scoped context so selectors only match within scopeRef
    const ctx = gsap.context(() => {}, scopeRef?.current ?? undefined);
    ctxRef.current = ctx;

    // Run user animations inside the context
    ctx.add(() => {
      callback(ctx);
    });

    return () => {
      // Kill all tweens, ScrollTriggers, and listeners created in this context
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ctxRef;
}
