import React, { createContext, useCallback, useState } from "react";
import { BOARD_THEMES, DEFAULT_BOARD_THEME_ID } from "../data/boardThemes";
import type { BoardTheme } from "../data/boardThemes";
import { PIECE_SETS, DEFAULT_PIECE_SET_ID } from "../data/pieceSets";
import type { PieceSetDef } from "../data/pieceSets";

const BOARD_THEME_STORAGE_KEY = "xlchess-board-theme";
const PIECE_SET_STORAGE_KEY = "xlchess-piece-set";

export interface BoardSettingsContextType {
  /** The currently active board color theme (resolved object, not just the id). */
  boardTheme: BoardTheme;
  /** The currently active piece set (resolved object, not just the id). */
  pieceSet: PieceSetDef;
  setBoardThemeId: (id: string) => void;
  setPieceSetId: (id: string) => void;
}

export const BoardSettingsContext = createContext<BoardSettingsContextType | undefined>(
  undefined,
);

function readStoredId(key: string, fallback: string, validIds: string[]): string {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored && validIds.includes(stored) ? stored : fallback;
  } catch {
    // Storage can throw in private browsing / locked-down environments.
    return fallback;
  }
}

/**
 * BoardSettingsProvider makes the player's chosen board theme + piece set
 * available anywhere in the app via `useBoardSettings()`, and persists the
 * choice to localStorage so it survives a refresh.
 *
 * This mirrors how the "Sound" preference is handled elsewhere in the app
 * (see SoundManager) — no login required, per-browser only. Settings ->
 * Board & Pieces is the only screen that writes to this context; every
 * board on the site just reads from it.
 *
 * NOTE (day-one scope): this is intentionally simple. Once the Settings
 * "Presets" tab is built out, this is the natural place to also sync the
 * selection to the signed-in user's account on the backend.
 */
export const BoardSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [boardThemeId, setBoardThemeIdState] = useState<string>(() =>
    readStoredId(
      BOARD_THEME_STORAGE_KEY,
      DEFAULT_BOARD_THEME_ID,
      BOARD_THEMES.map((t) => t.id),
    ),
  );
  const [pieceSetId, setPieceSetIdState] = useState<string>(() =>
    readStoredId(
      PIECE_SET_STORAGE_KEY,
      DEFAULT_PIECE_SET_ID,
      PIECE_SETS.map((p) => p.id),
    ),
  );

  const setBoardThemeId = useCallback((id: string) => {
    setBoardThemeIdState(id);
    try {
      window.localStorage.setItem(BOARD_THEME_STORAGE_KEY, id);
    } catch {
      // Ignore storage errors (private browsing, quota, etc.)
    }
  }, []);

  const setPieceSetId = useCallback((id: string) => {
    setPieceSetIdState(id);
    try {
      window.localStorage.setItem(PIECE_SET_STORAGE_KEY, id);
    } catch {
      // Ignore storage errors (private browsing, quota, etc.)
    }
  }, []);

  const boardTheme = BOARD_THEMES.find((t) => t.id === boardThemeId) ?? BOARD_THEMES[0];
  const pieceSet = PIECE_SETS.find((p) => p.id === pieceSetId) ?? PIECE_SETS[0];

  return (
    <BoardSettingsContext.Provider
      value={{ boardTheme, pieceSet, setBoardThemeId, setPieceSetId }}
    >
      {children}
    </BoardSettingsContext.Provider>
  );
};
