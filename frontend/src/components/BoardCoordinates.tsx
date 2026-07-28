/**
 * BoardCoordinates.tsx
 *
 * Renders Chess.com-style board coordinates as absolute-positioned spans
 * overlaid on the chessboard container.
 *
 * ── Placement ──────────────────────────────────────────────────────────────
 *  • File letters (a–h): bottom-right corner of each square in the bottom rank
 *  • Rank numbers (8–1): top-left corner of each square in the leftmost file
 *
 * ── Colors (alternating with square background) ────────────────────────────
 *  • Dark square  → light label  (#FFF8E5 warm cream)
 *  • Light square → dark label   (#5C7D3A deep green)
 *
 * Usage: Place inside any `position: relative; overflow: hidden` board container.
 *   <div className="relative overflow-hidden aspect-square w-full">
 *     <Chessboard ... />
 *     <BoardCoordinates boardOrientation={boardOrientation} />
 *   </div>
 */
import React from "react";
import { useBoardSettings } from "../hooks/useBoardSettings";

interface BoardCoordinatesProps {
  boardOrientation?: "white" | "black";
}

const BASE_STYLE: React.CSSProperties = {
  position: "absolute",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "9.5px",
  fontWeight: 700,
  lineHeight: 1,
  pointerEvents: "none",
  userSelect: "none",
  zIndex: 25,
};

export function BoardCoordinates({
  boardOrientation = "white",
}: BoardCoordinatesProps) {
    const { boardTheme } = useBoardSettings();
  const FILES =
    boardOrientation === "white"
      ? ["a", "b", "c", "d", "e", "f", "g", "h"]
      : ["h", "g", "f", "e", "d", "c", "b", "a"];

  const RANKS =
    boardOrientation === "white"
      ? ["8", "7", "6", "5", "4", "3", "2", "1"]
      : ["1", "2", "3", "4", "5", "6", "7", "8"];

  return (
    <>
      {/* File letters — bottom-right of each square on the last rank */}
      {FILES.map((file, col) => {
        const isDark = (7 + col) % 2 === 1;
        return (
          <span
            key={`file-${file}`}
            aria-hidden="true"
            style={{
              ...BASE_STYLE,
              bottom: "2px",
              right: `calc(${(7 - col) * 12.5}% + 2px)`,
              color: isDark ? boardTheme.light : boardTheme.dark,
            }}
          >
            {file}
          </span>
        );
      })}

      {/* Rank numbers — top-left of each square on the leftmost file */}
      {RANKS.map((rank, row) => {
        const isDark = row % 2 !== 0;
        return (
          <span
            key={`rank-${rank}`}
            aria-hidden="true"
            style={{
              ...BASE_STYLE,
              top: `calc(${row * 12.5}% + 2px)`,
              left: "2px",
              color: isDark ? boardTheme.light : boardTheme.dark,
            }}
          >
            {rank}
          </span>
        );
      })}
    </>
  );
}
