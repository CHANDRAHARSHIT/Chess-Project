/**
 * useMoveTrail.ts
 *
 * Stubbed implementation of move trail hook.
 * The visual motion smear trail is now drawn dynamically on a canvas during piece movement.
 */

import { useCallback } from 'react';

export function useMoveTrail() {
  const clearTrail = useCallback(() => {
    // Disabled in favor of the new canvas trail cleanup inside HeroPuzzle.tsx
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const showTrail = useCallback((_from: string, _to: string) => {
    // Disabled in favor of the canvas motion smear during piece movement
  }, []);

  return { showTrail, clearTrail };
}

