/**
 * boardSettingsContext.instance.ts
 * The Context object and its type live here, separate from the provider component in
 * BoardSettingsContext.tsx, so that file can export only a component (react-refresh/
 * only-export-components requires a component-only file for Fast Refresh to work).
 */
import { createContext } from "react";
import type { BoardTheme } from "@/shared/appearance/boardThemes";
import type { PieceSetDef } from "@/shared/appearance/pieceSets";

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
