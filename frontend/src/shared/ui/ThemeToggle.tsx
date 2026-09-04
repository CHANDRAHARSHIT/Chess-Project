import React from "react";
import { useTheme } from "@/shared/appearance/useTheme";
import {
  AnimatedThemeToggler,
  type TransitionVariant,
} from "./AnimatedThemeToggler";

export interface ThemeToggleProps {
  className?: string;
  variant?: TransitionVariant;
  duration?: number;
  fromCenter?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "w-14 h-7",
  variant = "circle",
  duration = 500,
  fromCenter = false,
}) => {
  const { themeMode, setThemeModeId } = useTheme();

  const activeTheme: "light" | "dark" =
    themeMode.id === "light" ? "light" : "dark";

  return (
    <AnimatedThemeToggler
      theme={activeTheme}
      onThemeChange={(newTheme) => setThemeModeId(newTheme)}
      duration={duration}
      variant={variant}
      fromCenter={fromCenter}
      className={className}
    />
  );
};

export default ThemeToggle;
