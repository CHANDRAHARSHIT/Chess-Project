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
import type { ChessboardOptions, SquareHandlerArgs } from 'react-chessboard';
import type { PieceDropHandlerArgs } from 'react-chessboard';
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
    [from]: { background: 'rgba(255, 255, 0, 0.45)' },
  };

  for (const m of moves) {
    const isCapture = m.flags.includes('c') || m.flags.includes('e');
    styles[m.to] = isCapture
      ? {
          // Red ring for capture squares — piece art remains visible through
          // the transparent center, matching Chess.com / Lichess convention.
          background: "rgba(220,38,38,0.5)",
          borderRadius: "50%",
        }
      : {
          // Filled dark dot for quiet (non-capture) moves
          background:
            'radial-gradient(rgba(0,0,0,0.18) 22%, transparent 22%)',
          borderRadius: '50%',
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
  // without re-creating the function on every render.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Clear selection whenever the position changes externally (new puzzle, etc.)
  const position = options.position;
  useEffect(() => {
    setMoveFrom(null);
    setOptionSquares({});
  }, [position]);

  // Also clear selection when the board becomes non-interactive (e.g. HeroPuzzle
  // sets allowDragging=false while the engine is thinking or the slide is inactive).
  const allowDragging = options.allowDragging;
  useEffect(() => {
    if (allowDragging === false) {
      setMoveFrom(null);
      setOptionSquares({});
    }
  }, [allowDragging]);

  const handleSquareClick = useCallback(({ piece, square }: SquareHandlerArgs) => {
    const { onPieceDrop, onSquareClick, allowDragging: isDraggingAllowed } = optionsRef.current;
    const fen = fenFromPosition(optionsRef.current.position);

    // Always forward to the board's own handler first so existing logic runs.
    onSquareClick?.({ piece, square });

    // Skip click-to-move when the board is not interactive.
    if (!onPieceDrop) return;
    if (isDraggingAllowed === false) return;

    const currentMoveFrom = moveFrom; // capture from closure for this invocation

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

    // ── Case 2: Clicking an own piece → select it (or re-select) ──
    if (isOwnPiece(fen, square)) {
      setMoveFrom(square);
      setOptionSquares(buildOptionSquares(fen, square));
      return;
    }

    // ── Case 3: Clicked empty / enemy square without a prior selection ──
    setMoveFrom(null);
    setOptionSquares({});
  }, [moveFrom]);

  // If this board doesn't handle piece drops (e.g. EditPositionBoard), skip.
  // Also skip when allowDragging is explicitly false — this is how HeroPuzzle
  // marks carousel slides that are inactive or in an engine-thinking phase.
  if (!options.onPieceDrop || options.allowDragging === false) {
    return options;
  }

  return {
    ...options,
    onSquareClick: handleSquareClick,
    squareStyles: {
      // Click-to-move selection dots are the base layer.
      ...optionSquares,
      // Board-level highlights (last move, hints, errors) always win on top.
      ...options.squareStyles,
    },
  };
}
