/**
 * themeContext.instance.ts
 * The Context object and its type live here, separate from the provider component in
 * ThemeContext.tsx, so that file can export only a component (react-refresh/
 * only-export-components requires a component-only file for Fast Refresh to work).
 */
import { createContext } from "react";
import type { ThemeMode } from "@/shared/appearance/themeModes";

export interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeModeId: (id: string) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
