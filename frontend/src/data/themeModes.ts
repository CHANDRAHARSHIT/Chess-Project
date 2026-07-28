/**
 * themeModes.ts
 *
 * Available application theme modes.
 */

export interface ThemeMode {
  id: string;
  name: string;
}

export const THEME_MODES: ThemeMode[] = [
  {
    id: "system",
    name: "Device Theme",
  },
  {
    id: "dark",
    name: "Dark",
  },
  {
    id: "light",
    name: "Light",
  },
];

export const DEFAULT_THEME_MODE_ID = "system";