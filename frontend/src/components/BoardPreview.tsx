import { useBoardSettings } from "../hooks/useBoardSettings";
import type { BoardTheme } from "../data/boardThemes";
import type { PieceSetDef } from "../data/pieceSets";

// A compact 3x3 corner-of-the-board sample, showing one of each piece type
// so both the square colors and the piece style are visible at a glance —
// same idea as the little preview chess.com shows next to its board list.
const PREVIEW_ROWS: Array<{ rank: number; pieces: (string | null)[] }> = [
  { rank: 8, pieces: ["bB", "bQ", "bP"] },
  { rank: 7, pieces: [null, null, null] },
  { rank: 6, pieces: ["wN", "wK", "wR"] },
];

interface BoardPreviewProps {
  size?: number;
  /** Optional overrides — used while a change is "pending" (not yet saved). */
  theme?: BoardTheme;
  pieceSet?: PieceSetDef;
}

export default function BoardPreview({ size = 280, theme, pieceSet }: BoardPreviewProps) {
  const settings = useBoardSettings();
  const activeTheme = theme ?? settings.boardTheme;
  const activePieceSet = pieceSet ?? settings.pieceSet;
  const squareSize = size / 3;

  return (
    <div
      className="select-none rounded-lg overflow-hidden border border-brand-border/60 shadow-lg shadow-black/40"
      style={{ width: size, height: size }}
    >
      {PREVIEW_ROWS.map((row, rowIndex) => (
        <div key={row.rank} className="flex" style={{ height: squareSize }}>
          {row.pieces.map((code, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const renderPiece = code ? activePieceSet.pieces[code] : undefined;

            return (
              <div
                key={colIndex}
                className="relative flex items-center justify-center"
                style={{
                  width: squareSize,
                  height: squareSize,
                  backgroundColor: isLight ? activeTheme.light : activeTheme.dark,
                }}
              >
                {colIndex === 0 && (
                  <span
                    className="absolute top-1 left-1.5 text-[10px] font-mono font-bold leading-none"
                    style={{
                      color: isLight ? activeTheme.dark : activeTheme.light,
                      opacity: 0.75,
                    }}
                  >
                    {row.rank}
                  </span>
                )}
                {renderPiece && (
                  <div style={{ width: "70%", height: "70%" }}>{renderPiece()}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
