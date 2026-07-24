/**
 * ThemedChessboard.tsx
 *
 * The one place every board's square colors + piece art come from.
 *
 * Any component that renders a chess board should render <ThemedChessboard />
 * instead of importing <Chessboard /> from react-chessboard directly. That
 * means:
 *
 *   - A newly added board automatically respects the player's
 *     Settings -> Board & Pieces choice with zero extra wiring — just use
 *     this component instead of react-chessboard's.
 *   - There is exactly one place that maps our BoardTheme/PieceSet objects
 *     onto react-chessboard's actual prop shape. If react-chessboard's
 *     theming API ever changes (or we swap libraries entirely), this file
 *     is the only thing that needs to change — no hunting through every
 *     board component in the app.
 *
 * Usage — identical to react-chessboard's own <Chessboard />, just with a
 * different import:
 *
 *   import { ThemedChessboard } from "../components/ThemedChessboard";
 *
 *   <ThemedChessboard
 *     options={{
 *       position: fen,
 *       onPieceDrop: handleDrop,
 *       showNotation: true,
 *       // ...any other react-chessboard option
 *     }}
 *   />
 *
 * Do NOT pass `darkSquareStyle`, `lightSquareStyle`, or `pieces` in
 * `options` — those are owned by Settings -> Board & Pieces and applied
 * automatically here. (If a board ever has a genuine one-off reason to
 * override one — e.g. a fixed-look marketing screenshot — it still can:
 * whatever is passed in `options` is spread last and wins. That's an
 * escape hatch, not the normal path, so reach for it deliberately.)
 */
import { Chessboard } from "react-chessboard";
import type { ChessboardOptions } from "react-chessboard";
import { useBoardSettings } from "../hooks/useBoardSettings";

interface ThemedChessboardProps {
  options: ChessboardOptions;
}

export function ThemedChessboard({ options }: ThemedChessboardProps) {
  const { boardTheme, pieceSet } = useBoardSettings();

  return (
    <Chessboard
      options={{
        darkSquareStyle: { backgroundColor: boardTheme.dark },
        lightSquareStyle: { backgroundColor: boardTheme.light },
        pieces: pieceSet.pieces,
        ...options,
      }}
    />
  );
}
