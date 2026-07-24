import { useContext } from "react";
import { BoardSettingsContext } from "../context/BoardSettingsContext";
import type { BoardSettingsContextType } from "../context/BoardSettingsContext";

/**
 * Custom React hook to read/update the player's board theme and piece set.
 *
 * Any component that renders a <Chessboard /> should pull `boardTheme` and
 * `pieceSet` from here instead of hardcoding colors, so it automatically
 * stays in sync with Settings → Board & Pieces.
 *
 * This hook requires that the calling component is wrapped in a
 * `<BoardSettingsProvider>`.
 *
 * @throws {Error} If used outside of a BoardSettingsProvider.
 */
export function useBoardSettings(): BoardSettingsContextType {
  const context = useContext(BoardSettingsContext);
  if (context === undefined) {
    throw new Error("useBoardSettings must be used within a BoardSettingsProvider");
  }
  return context;
}
