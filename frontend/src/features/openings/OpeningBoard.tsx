/**
 * OpeningBoard.tsx
 *
 * The interactive chessboard used in the opening trainer.
 * Wraps ThemedChessboard (respects user's board/piece Settings) and
 * overlays BoardCoordinates exactly like the rest of the app's boards.
 */

import { ThemedChessboard } from "@/components/ThemedChessboard";
import { BoardCoordinates } from "@/components/BoardCoordinates";


interface OpeningBoardProps {
  fen: string;
  boardOrientation: "white" | "black";
  squareStyles: Record<string, React.CSSProperties>;
  onPieceDrop: (from: string, to: string) => boolean;
  allowDragging: boolean;
  ringStyle: "none" | "wrong" | "complete";
}

export function OpeningBoard({
  fen,
  boardOrientation,
  squareStyles,
  onPieceDrop,
  allowDragging,
  ringStyle,
}: OpeningBoardProps) {
  const borderClass =
    ringStyle === "wrong"
      ? "border-rose-500 ring-4 ring-rose-500/25"
      : ringStyle === "complete"
        ? "border-emerald-500 ring-4 ring-emerald-500/25 animate-pulse"
        : "border-[rgba(212,175,110,0.80)]";

  return (
    <div
      className={`relative w-full max-w-[480px] sm:max-w-[520px] aspect-square border overflow-hidden bg-brand-surface transition-all duration-300 ${borderClass}`}
    >
      <ThemedChessboard
        options={{
          position: fen,
          onPieceDrop: ({ sourceSquare, targetSquare }) =>
            onPieceDrop(sourceSquare, targetSquare ?? ""),
          boardOrientation,
          squareStyles,
          boardStyle: { borderRadius: "0px" },
          showNotation: false,
          allowDragging,
        }}
      />
      <BoardCoordinates boardOrientation={boardOrientation} />
    </div>
  );
}
