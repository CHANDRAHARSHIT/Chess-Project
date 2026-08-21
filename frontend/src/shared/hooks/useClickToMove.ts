/**
 * useClickToMove.ts
 *
 * A reusable hook that adds chess.com-style click-to-move to any board that
 * uses ThemedChessboard.  It works by intercepting the ChessboardOptions
 * object and augmenting it with:
 *
 *   - an `onSquareClick` handler that manages selection + move execution
 *   - merged `squareStyles` that highlight the selected square and legal moves
 *
 * The hook is transparent — it passes options through unchanged when:
 *   - `onPieceDrop` is not provided (e.g. EditPositionBoard which owns its
 *     own pointer-capture drag system)
 *   - `allowDragging` is explicitly `false` — this is how HeroPuzzle signals
 *     that a board slot is not currently interactive (e.g. non-active carousel
 *     slide, or engine-thinking phase).  Honouring this flag ensures clicks on
 *     those boards are silently ignored, matching the drag behaviour.
 *
 * The board's existing `onSquareClick` and `squareStyles` are preserved and
 * composed in – not replaced.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ChessboardOptions, SquareHandlerArgs, PieceHandlerArgs, PieceDropHandlerArgs } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Build the highlight overlay for a selected square + its legal destinations. */
function buildOptionSquares(
  fen: string | undefined,
  from: string,
): Record<string, React.CSSProperties> {
  let game: Chess;
  try {
    game = new Chess(fen);
  } catch {
    return {};
  }

  const moves = game.moves({ square: from as Square, verbose: true });
  const styles: Record<string, React.CSSProperties> = {
    [from]: { backgroundColor: 'rgba(255, 255, 0, 0.45)' },
  };

  for (const m of moves) {
    const isCapture = m.flags.includes('c') || m.flags.includes('e');
    styles[m.to] = isCapture
      ? {
          // Red ring for capture squares — piece art remains visible through
          // the transparent center, matching Chess.com / Lichess convention.
          backgroundImage: 'radial-gradient(transparent 54%, rgba(220, 38, 38, 0.5) 54%)',
        }
      : {
          // Filled dark dot for quiet (non-capture) moves
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.18) 22%, transparent 22%)',
        };
  }

  return styles;
}

/** True when `square` is a legal destination from `from` given `fen`. */
function isLegalMove(fen: string | undefined, from: string, to: string): boolean {
  try {
    const game = new Chess(fen);
    return game
      .moves({ square: from as Square, verbose: true })
      .some((m) => m.to === to);
  } catch {
    return false;
  }
}

/** True when `square` holds a piece belonging to the side whose turn it is. */
function isOwnPiece(fen: string | undefined, square: string): boolean {
  try {
    const game = new Chess(fen);
    const piece = game.get(square as Square);
    return Boolean(piece && piece.color === game.turn());
  } catch {
    return false;
  }
}

/** Extract a plain FEN string from the options position field (may be an object). */
function fenFromPosition(position: ChessboardOptions['position']): string | undefined {
  if (typeof position === 'string' && position !== 'start') return position;
  return undefined; // "start" or PositionDataType object → fall back to default Chess() position
}

// ─── hook ────────────────────────────────────────────────────────────────────

/**
 * Augments a ChessboardOptions object with click-to-move behaviour.
 *
 * Returns the same options unchanged when:
 *   - `onPieceDrop` is not provided (non-interactive board)
 *   - `allowDragging` is explicitly set to false (editor mode)
 */
export function useClickToMove(options: ChessboardOptions): ChessboardOptions {
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});

  // Keep a stable ref to the latest options so our callback never goes stale
  // without re-creating the function on every render. Refs must be written in an
  // effect, not during render (React refs must not be read/written while rendering).
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  // Track the last processed click to deduplicate rapid duplicate events (e.g. piece + square click)
  const lastClickRef = useRef<{ square: string; time: number } | null>(null);

  // Clear selection whenever the position changes externally (new puzzle, etc.). This is React's
  // documented "adjusting state when a prop changes" pattern: compare against the previous value
  // in a parallel state slot and update during render, rather than resetting in an effect.
  const position = options.position;
  const [prevPosition, setPrevPosition] = useState(position);
  if (position !== prevPosition) {
    setPrevPosition(position);
    setMoveFrom(null);
    setOptionSquares({});
  }

  // Also clear selection when the board becomes non-interactive (e.g. HeroPuzzle
  // sets allowDragging=false while the engine is thinking or the slide is inactive).
  const allowDragging = options.allowDragging;
  const [prevAllowDragging, setPrevAllowDragging] = useState(allowDragging);
  if (allowDragging !== prevAllowDragging) {
    setPrevAllowDragging(allowDragging);
    if (allowDragging === false) {
      setMoveFrom(null);
      setOptionSquares({});
    }
  }

  const handleSquareClick = useCallback(
    ({ piece, square }: SquareHandlerArgs) => {
      const { onPieceDrop, onSquareClick, allowDragging: isDraggingAllowed } = optionsRef.current;
      const fen = fenFromPosition(optionsRef.current.position);

      // Always forward to the board's own handler first so existing logic runs.
      onSquareClick?.({ piece, square });

      // Skip click-to-move when the board is not interactive.
      if (!onPieceDrop) return;
      if (isDraggingAllowed === false) return;

      const now = Date.now();
      if (
        lastClickRef.current &&
        lastClickRef.current.square === square &&
        now - lastClickRef.current.time < 50
      ) {
        return;
      }
      lastClickRef.current = { square, time: now };

      const currentMoveFrom = moveFrom;

      // ── Case 0: Tapping/clicking the currently selected piece again → deselect ──
      if (currentMoveFrom === square) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }

      // ── Case 1: A piece is selected and the clicked square is a legal target ──
      if (currentMoveFrom && isLegalMove(fen, currentMoveFrom, square)) {
        const payload: PieceDropHandlerArgs = {
          piece: {
            isSparePiece: false,
            position: currentMoveFrom,
            pieceType: piece?.pieceType ?? '',
          },
          sourceSquare: currentMoveFrom,
          targetSquare: square,
        };
        const accepted = onPieceDrop(payload);

        if (accepted) {
          setMoveFrom(null);
          setOptionSquares({});
          return;
        }

        // Drop was rejected (wrong puzzle move, etc.) – clear selection.
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }

      // ── Case 2: Clicking an own piece → select it (or switch selection) ──
      if (isOwnPiece(fen, square)) {
        setMoveFrom(square);
        setOptionSquares(buildOptionSquares(fen, square));
        return;
      }

      // ── Case 3: Clicked empty / enemy square without a prior selection ──
      setMoveFrom(null);
      setOptionSquares({});
    },
    [moveFrom]
  );

  const handlePieceClick = useCallback(
    ({ isSparePiece, piece, square }: PieceHandlerArgs) => {
      optionsRef.current.onPieceClick?.({ isSparePiece, piece, square });
      if (square) {
        handleSquareClick({ piece, square });
      }
    },
    [handleSquareClick]
  );

  // If this board doesn't handle piece drops (e.g. EditPositionBoard), skip.
  // Also skip when allowDragging is explicitly false — this is how HeroPuzzle
  // marks carousel slides that are inactive or in an engine-thinking phase.
  if (!options.onPieceDrop || options.allowDragging === false) {
    return options;
  }

  // Combine board squareStyles (e.g. last move highlights) with click-to-move optionSquares.
  // When a square exists in both (e.g. move dot on yellow last-move square), preserve
  // the board's highlight color as backgroundColor while overlaying optionSquares's dot gradient.
  const mergedSquareStyles: Record<string, React.CSSProperties> = {
    ...options.squareStyles,
  };

  for (const [sq, dotStyle] of Object.entries(optionSquares)) {
    const boardStyle = mergedSquareStyles[sq];
    if (!boardStyle) {
      mergedSquareStyles[sq] = dotStyle;
    } else {
      const boardBgColor =
        boardStyle.backgroundColor ||
        (typeof boardStyle.background === 'string' && !boardStyle.background.includes('gradient')
          ? boardStyle.background
          : undefined);

      const cleanBoardStyle = { ...boardStyle };
      delete cleanBoardStyle.background;

      mergedSquareStyles[sq] = {
        ...cleanBoardStyle,
        ...dotStyle,
        ...(boardBgColor ? { backgroundColor: boardBgColor } : {}),
      };
    }
  }

  return {
    ...options,
    onSquareClick: handleSquareClick,
    onPieceClick: handlePieceClick,
    squareStyles: mergedSquareStyles,
  };
}
