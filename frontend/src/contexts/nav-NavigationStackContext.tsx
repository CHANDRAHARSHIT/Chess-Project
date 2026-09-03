import React, { useCallback, useState } from "react";
import type { NavigationItem } from "@/contexts/nav-navigationStackContext.instance";
import { NavigationStackContext } from "@/contexts/nav-navigationStackContext.instance";

const MAX_STACK_SIZE = 3;

/**
 * Stores the user's recent navigation history.
 *
 * Current scope:
 * - Home -> Membership
 * - Puzzles -> Membership
 * - Settings -> Membership
 *
 * The stack is intentionally generic so future pages can reuse it without
 * changing the implementation.
 */
export const NavigationStackProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [stack, setStack] = useState<NavigationItem[]>([]);

  const push = useCallback((item: NavigationItem) => {
    setStack((prev) => {
      // Prevent duplicate consecutive entries.
      if (prev.at(-1)?.path === item.path) {
        return prev;
      }

      const updated = [...prev, item];

      // Keep only the latest MAX_STACK_SIZE entries.
      return updated.slice(-MAX_STACK_SIZE);
    });
  }, []);

  const getPrevious = useCallback(() => {
    return stack.at(-1);
  }, [stack]);

  const clear = useCallback(() => {
    setStack([]);
  }, []);

  return (
    <NavigationStackContext.Provider
      value={{
        stack,
        push,
        getPrevious,
        clear,
      }}
    >
      {children}
    </NavigationStackContext.Provider>
  );
};