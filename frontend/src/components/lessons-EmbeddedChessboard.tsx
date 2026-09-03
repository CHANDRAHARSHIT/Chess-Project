import { useState } from "react";
import { X, RotateCcw, Palette, Eraser, Trash2 } from "lucide-react";
import { ThemedChessboard } from "@/components/ui-ThemedChessboard";
import type { PieceDropHandlerArgs, SquareHandlerArgs } from "react-chessboard";
import { useBoardSettings } from "@/hooks/appearance-useBoardSettings";
import {
  parseFenToEditorState,
  buildFenFromEditorState,
  movePieceBetweenSquares,
  setPieceOnSquare,
  type EditorTool,
  type EditorPieceCode,
} from "@/utils/chess-positionEditor";

interface EmbeddedChessboardProps {
  fen?: string;
  onFenChange?: (fen: string) => void;
  onRemove?: () => void;
}

const PIECE_ROWS = [
  ["wK", "wQ", "wR", "wB", "wN", "wP"] as const,
  ["bK", "bQ", "bR", "bB", "bN", "bP"] as const,
] as const;

export function EmbeddedChessboard({
  fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  onFenChange,
  onRemove,
}: EmbeddedChessboardProps) {
  const [showSparePieces, setShowSparePieces] = useState(false);
  const [selectedTool, setSelectedTool] = useState<EditorTool | null>(null);
  const { pieceSet } = useBoardSettings();

  const handleClearBoard = () => {
    const currentFen = fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const state = parseFenToEditorState(currentFen);
    const nextFen = buildFenFromEditorState({ ...state, position: {} });
    onFenChange?.(nextFen);
  };

  const handlePieceDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
    const currentFen = fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const state = parseFenToEditorState(currentFen);

    // Case 1: Dragging off board -> erase piece from sourceSquare
    if (!targetSquare) {
      if (sourceSquare) {
        const nextPos = setPieceOnSquare(state.position, sourceSquare, "erase");
        const nextFen = buildFenFromEditorState({ ...state, position: nextPos });
        onFenChange?.(nextFen);
      }
      return true;
    }

    // Case 2: Free-form piece move from sourceSquare to targetSquare (ignoring legality/turns)
    if (sourceSquare && targetSquare) {
      const nextPos = movePieceBetweenSquares(state.position, sourceSquare, targetSquare);
      const nextFen = buildFenFromEditorState({ ...state, position: nextPos });
      onFenChange?.(nextFen);
      return true;
    }

    return true;
  };

  const handleSquareClick = ({ square }: SquareHandlerArgs) => {
    if (!selectedTool || !square) return;

    const currentFen = fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const state = parseFenToEditorState(currentFen);
    const nextPos = setPieceOnSquare(state.position, square, selectedTool);
    const nextFen = buildFenFromEditorState({ ...state, position: nextPos });
    onFenChange?.(nextFen);
  };

  return (
    <div
      contentEditable={false}
      onMouseDown={(e) => e.stopPropagation()}
      className="float-right ml-6 mb-6 w-[44%] max-w-[480px] min-w-[340px] rounded-xl border border-brand-border bg-brand-bg shadow-2xl select-none clear-none relative z-20 pointer-events-auto cursor-default font-sans"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-brand-surface/90 border-b border-brand-border rounded-t-xl">
        <span className="text-xs font-sans font-medium text-brand-text">
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowSparePieces(!showSparePieces);
            }}
            title={showSparePieces ? "Hide Piece Palette" : "Show Piece Palette"}
            aria-label="Toggle Piece Palette"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              showSparePieces
                ? "text-brand-accent bg-brand-accent/15 border border-brand-accent/30"
                : "text-brand-secondary hover:text-brand-text hover:bg-brand-text/10"
            }`}
          >
            <Palette className="w-4 h-4" />
          </button>

          {onFenChange && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFenChange("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
              }}
              title="Reset Board"
              aria-label="Reset Board"
              className="p-1.5 rounded-md text-brand-secondary hover:text-brand-text hover:bg-brand-text/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {onRemove && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }}
              title="Remove Board"
              aria-label="Remove Board"
              className="p-1.5 rounded-md text-brand-secondary hover:text-red-400 hover:bg-brand-text/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Spare Piece Palette */}
      {showSparePieces && (
        <div className="px-3 py-2 border-b border-brand-border bg-brand-surface/40 flex flex-col gap-1.5">
          {PIECE_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex items-center justify-center gap-1.5">
              {row.map((pieceCode) => {
                const PieceSvg = pieceSet.pieces[pieceCode as EditorPieceCode];
                const isSelected = selectedTool === pieceCode;

                return (
                  <button
                    key={pieceCode}
                    type="button"
                    onClick={() =>
                      setSelectedTool(isSelected ? null : (pieceCode as EditorTool))
                    }
                    title={`Select ${pieceCode}`}
                    className={`w-7 h-7 flex items-center justify-center rounded border transition-all cursor-pointer ${
                      isSelected
                        ? "border-brand-accent bg-brand-accent/20 scale-105 shadow-[0_0_8px_rgba(212,175,110,0.3)]"
                        : "border-brand-border/40 hover:border-brand-border bg-brand-bg/60 hover:bg-brand-surface"
                    }`}
                  >
                    <div className="w-5 h-5">
                      <PieceSvg />
                    </div>
                  </button>
                );
              })}

              {rowIndex === 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedTool(selectedTool === "erase" ? null : "erase")
                    }
                    title="Eraser (click square to clear)"
                    aria-label="Eraser tool"
                    className={`w-7 h-7 flex items-center justify-center rounded border transition-all cursor-pointer ${
                      selectedTool === "erase"
                        ? "border-red-400 bg-red-400/20 text-red-400 scale-105"
                        : "border-brand-border/40 hover:border-brand-border text-brand-secondary hover:text-brand-text bg-brand-bg/60"
                    }`}
                  >
                    <Eraser className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleClearBoard}
                    title="Clear Board"
                    aria-label="Clear Board"
                    className="w-7 h-7 flex items-center justify-center rounded border border-brand-border/40 hover:border-red-400/60 text-brand-secondary hover:text-red-400 bg-brand-bg/60 hover:bg-red-400/10 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Board Body */}
      <div className="p-3.5">
        <div className="w-full aspect-square rounded-lg overflow-hidden border border-brand-border/60">
          <ThemedChessboard
            options={{
              position: fen,
              onPieceDrop: handlePieceDrop,
              onSquareClick: handleSquareClick,
              showNotation: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
