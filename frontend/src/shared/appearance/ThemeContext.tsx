import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_THEME_MODE_ID,
  THEME_MODES,
} from "@/shared/appearance/themeModes";
import { ThemeContext } from "./themeContext.instance";

const STORAGE_KEY = "theme-mode";

function getResolvedTheme(mode: string): "light" | "dark" {
  if (mode === "light" || mode === "dark") {
    return mode;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeModeId, setThemeModeId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME_MODE_ID;
  });

  const themeMode =
    THEME_MODES.find((mode) => mode.id === themeModeId) ??
    THEME_MODES.find((mode) => mode.id === DEFAULT_THEME_MODE_ID)!;

  // ① Save the selected mode
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeMode.id);
  }, [themeMode]);

  // ② Add the new effect HERE
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      document.documentElement.dataset.theme = getResolvedTheme(themeMode.id);
    };

    applyTheme();

    if (themeMode.id === "system") {
      mediaQuery.addEventListener("change", applyTheme);

      return () => {
        mediaQuery.removeEventListener("change", applyTheme);
      };
    }
  }, [themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      setThemeModeId,
    }),
    [themeMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}