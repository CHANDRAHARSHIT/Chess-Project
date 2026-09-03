/**
 * navigationStackContext.instance.ts
 * The Context object and its type live here, separate from the provider component in
 * NavigationStackContext.tsx, so that file can export only a component (react-refresh/
 * only-export-components requires a component-only file for Fast Refresh to work).
 */
import { createContext } from "react";

export interface NavigationItem {
  label: string;
  path: string;
}

export interface NavigationStackContextType {
  stack: NavigationItem[];
  push: (item: NavigationItem) => void;
  getPrevious: () => NavigationItem | undefined;
  clear: () => void;
}

export const NavigationStackContext = createContext<
  NavigationStackContextType | undefined
>(undefined);
