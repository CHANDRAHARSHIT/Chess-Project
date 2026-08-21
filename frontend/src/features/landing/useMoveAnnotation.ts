import { useState, useRef, useCallback, useEffect } from 'react';

export type BadgeType = '!!' | '!' | '!?' | '?!' | '?' | '??';

export interface ActiveAnnotation {
  id: number;
  square: string;
  badge: BadgeType;
}

export function useMoveAnnotation() {
  const [activeAnnotation, setActiveAnnotation] = useState<ActiveAnnotation | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextIdRef = useRef(0);

  const clearAnnotation = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setActiveAnnotation(null);
  }, []);

  const triggerAnnotation = useCallback((square: string, badge: BadgeType) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const id = nextIdRef.current++;
    setActiveAnnotation({ id, square, badge });

    timerRef.current = setTimeout(() => {
      setActiveAnnotation(null);
      timerRef.current = null;
    }, 1200);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    activeAnnotation,
    triggerAnnotation,
    clearAnnotation,
  };
}
