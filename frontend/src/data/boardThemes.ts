/**
 * boardThemes.ts
 *
 * Defines the set of board color themes a player can choose from on the
 * Settings → Board & Pieces → Boards tab.
 *
 * This is intentionally a small, static list for now (day-one implementation).
 * When the "Presets" tab gets built out later, this is the file that will
 * likely grow / move to fetch from the backend instead of being hardcoded.
 */

export interface BoardTheme {
  /** Stable identifier, persisted to localStorage and used as the React key. */
  id: string;
  /** Display name shown in the settings UI. */
  name: string;
  /** Hex color for light squares. */
  light: string;
  /** Hex color for dark squares. */
  dark: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  { id: "green", name: "Green", light: "#EEEED2", dark: "#769656" },
  { id: "walnut", name: "Walnut", light: "#E8CE9C", dark: "#8B5A3C" },
  { id: "midnight", name: "Midnight", light: "#85A3C4", dark: "#2E4364" },
  { id: "tan", name: "Tan", light: "#F0DAB5", dark: "#C6844C" },
  { id: "ice", name: "Ice", light: "#DDEEF6", dark: "#9AC7DE" },
];

export const DEFAULT_BOARD_THEME_ID = BOARD_THEMES[0].id;
