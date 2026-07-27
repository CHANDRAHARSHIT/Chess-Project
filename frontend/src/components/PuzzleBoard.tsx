import { useState, useRef, useCallback, useEffect } from "react";
import { ThemedChessboard } from "./ThemedChessboard";
import { Chess } from "chess.js";
import type { ChessPuzzle } from "../utils/PuzzleLoader";
import { validateMove } from "../utils/PuzzleValidator";
import {
  HelpCircle,
  RotateCcw,
  ArrowRight,
  Play,
  Check,
  Undo2,
} from "lucide-react";
import { soundManager } from "../utils/SoundManager";
import { BoardCoordinates } from "./BoardCoordinates";

export interface PuzzleBoardProps {
  puzzle: ChessPuzzle;
  puzzleNumber?: string | number;
  boardId?: string;
  onSolved?: () => void;
  onFailed?: () => void;
  onNextPuzzle?: () => void;
}

export function PuzzleBoard({
  puzzle,
  puzzleNumber,
  boardId = "puzzle-board",
  onSolved,
  onFailed,
  onNextPuzzle,
}: PuzzleBoardProps) {
  const gameRef = useRef<Chess>(new Chess());
  const [gameFen, setGameFen] = useState<string>(puzzle.fen);
  const [puzzleStatus, setPuzzleStatus] = useState<
    "solving" | "solved" | "failed"
  >("solving");
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [errorSquares, setErrorSquares] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const [solutionIndex, setSolutionIndex] = useState<number>(0);

  // Parse space-separated solution moves (e.g. "e7e1 a1e1 e8e1" or "Qh5#")
  const solutionMoves = (puzzle.solution || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number>(0);

  useEffect(() => {
    const el = boardContainerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const width = Math.floor(rect.width);

      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        width === 0
      ) {
        setMeasuredWidth(0);
      } else {
        setMeasuredWidth(width);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reset board and status when the puzzle prop changes
  useEffect(() => {
    try {
      gameRef.current = new Chess(puzzle.fen);
      setGameFen(puzzle.fen);
    } catch (e) {
      console.error("Failed to parse FEN in PuzzleBoard:", puzzle.fen, e);
      gameRef.current = new Chess();
      setGameFen(gameRef.current.fen());
    }
    setSolutionIndex(0);
    setPuzzleStatus("solving");
    setLastMove(null);
    setIsShaking(false);
    setErrorSquares(null);
    setHintSquare(null);
  }, [puzzle.id, puzzle.fen]);

  // Determine player color and board orientation from active color in FEN
  const playerColor = gameRef.current.turn(); // 'w' or 'b'
  const boardOrientation = playerColor === "w" ? "white" : "black";

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      // Ignore drops if the puzzle is already solved
      if (puzzleStatus === "solved") {
        return false;
      }

      const game = gameRef.current;

      // 1. Enforce that the piece belongs to the active side
      const piece = game.get(sourceSquare as any);
      if (!piece || piece.color !== game.turn()) {
        return false;
      }

      // 2. Target move to validate against
      const expectedMoveStr = solutionMoves[solutionIndex] || puzzle.solution;

      // 3. Validate move against chess.js rules
      try {
        const move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });

        if (move) {
          setHintSquare(null);

          // 4. Check if the legal move matches the puzzle's expected solution move
          const isCorrect = validateMove(move, expectedMoveStr);

          if (isCorrect) {
            // Correct Move: commit state
            setGameFen(game.fen());
            setLastMove({ from: sourceSquare, to: targetSquare });

            const nextIndex = solutionIndex + 1;

            // Check if this was the final solution move (or only 1 solution move)
            if (
              nextIndex >= solutionMoves.length ||
              solutionMoves.length <= 1
            ) {
              setPuzzleStatus("solved");

              if (game.isCheckmate()) {
                soundManager.playCheckmate();
              } else if (game.inCheck()) {
                soundManager.playCheck();
              } else if (move.flags.includes("k") || move.flags.includes("q")) {
                soundManager.playCastle();
              } else if (move.flags.includes("p")) {
                soundManager.playPromote();
              } else if (move.captured) {
                soundManager.playCapture();
              } else {
                soundManager.playMove();
              }
              soundManager.playApplause();

              onSolved?.();
              return true;
            } else {
              // Intermediate move in multi-move sequence: play move sound, then auto-reply opponent move
              if (game.inCheck()) {
                soundManager.playCheck();
              } else if (move.captured) {
                soundManager.playCapture();
              } else {
                soundManager.playMove();
              }

              setSolutionIndex(nextIndex);

              // Auto-play opponent response move after short delay (400ms)
              const oppMoveStr = solutionMoves[nextIndex];
              if (oppMoveStr) {
                setTimeout(() => {
                  try {
                    const oppMove = game.move({
                      from: oppMoveStr.slice(0, 2),
                      to: oppMoveStr.slice(2, 4),
                      promotion: oppMoveStr[4] ?? "q",
                    });
                    if (oppMove) {
                      setGameFen(game.fen());
                      setLastMove({ from: oppMove.from, to: oppMove.to });
                      if (game.inCheck()) {
                        soundManager.playCheck();
                      } else if (oppMove.captured) {
                        soundManager.playCapture();
                      } else {
                        soundManager.playMove();
                      }
                    }
                  } catch (e) {
                    console.error(
                      "Opponent move execution failed:",
                      oppMoveStr,
                      e,
                    );
                  }
                  setSolutionIndex(nextIndex + 1);
                }, 400);
              }
              return true;
            }
          } else {
            // Incorrect Move: Undo instantly in chess engine
            game.undo();
            setPuzzleStatus("failed");

            // Play illegal/wrong move sound
            soundManager.playIllegal();

            // Trigger visual feedback
            setIsShaking(true);
            setErrorSquares({ from: sourceSquare, to: targetSquare });

            setTimeout(() => {
              setIsShaking(false);
              setErrorSquares(null);
              setPuzzleStatus("solving");
            }, 800);

            onFailed?.();
            return false;
          }
        }
      } catch {
        // Illegal chess move - snap piece back
        soundManager.playIllegal();
      }

      return false;
    },
    [puzzle, puzzleStatus, solutionMoves, solutionIndex, onSolved, onFailed],
  );

  const handleHint = useCallback(() => {
    if (puzzleStatus === "solved") return;
    const game = gameRef.current;
    const legalMoves = game.moves({ verbose: true });
    const targetMoveStr = solutionMoves[solutionIndex] || puzzle.solution;
    const correctMove = legalMoves.find((m) => validateMove(m, targetMoveStr));
    if (correctMove) {
      setHintSquare(correctMove.from);
    }
  }, [puzzleStatus, puzzle.solution, solutionMoves, solutionIndex]);

  const canUndo = gameRef.current.history().length > 0;

  const handleUndo = useCallback(() => {
    const game = gameRef.current;
    if (game.history().length === 0) return;
    game.undo();
    setGameFen(game.fen());
    setPuzzleStatus("solving");
    setLastMove(null);
    setIsShaking(false);
    setErrorSquares(null);
    setHintSquare(null);
  }, []);

  const handleReset = useCallback(() => {
    gameRef.current = new Chess(puzzle.fen);
    setGameFen(puzzle.fen);
    setPuzzleStatus("solving");
    setLastMove(null);
    setIsShaking(false);
    setErrorSquares(null);
    setHintSquare(null);
  }, [puzzle.fen]);

  // Custom square highlights
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    customSquareStyles[lastMove.from] = {
      backgroundColor: "rgba(255, 214, 10, 0.35)",
    };
    customSquareStyles[lastMove.to] = {
      backgroundColor: "rgba(255, 214, 10, 0.50)",
    };
  }
  if (errorSquares) {
    customSquareStyles[errorSquares.from] = {
      backgroundColor: "rgba(239, 68, 68, 0.40)",
      boxShadow: "inset 0 0 0 3px rgba(239, 68, 68, 0.85)",
    };
    customSquareStyles[errorSquares.to] = {
      backgroundColor: "rgba(239, 68, 68, 0.55)",
      boxShadow: "inset 0 0 0 3px rgba(239, 68, 68, 0.85)",
    };
  }
  if (hintSquare) {
    customSquareStyles[hintSquare] = {
      backgroundColor: "rgba(255, 214, 10, 0.35)",
      boxShadow: "inset 0 0 0 3px rgba(255, 214, 10, 0.85)",
    };
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-3.5 w-full">
      {/* Top Heading */}
      <div className="text-center space-y-0.5 z-10">
        {puzzleNumber !== undefined && (
          <p className="font-mono text-xs text-brand-accent uppercase tracking-widest font-semibold">
            Puzzle #{puzzleNumber}
          </p>
        )}
      </div>

      <div
        ref={boardContainerRef}
        className={`relative w-full max-w-[500px] sm:max-w-[540px] aspect-square shadow-[0_20px_50px_rgba(212,175,110,0.03)] border overflow-hidden bg-brand-surface transition-all duration-300 z-10 ${
          isShaking
            ? "border-rose-500 ring-4 ring-rose-500/25"
            : puzzleStatus === "solved"
              ? "border-emerald-500 ring-4 ring-emerald-500/25 animate-pulse"
              : "border-brand-border/80"
        }`}
      >
        <ThemedChessboard
          options={{
            position: gameFen,
            onPieceDrop: ({ sourceSquare, targetSquare }) =>
              onDrop(sourceSquare, targetSquare ?? ""),
            boardOrientation: boardOrientation,
            squareStyles: customSquareStyles,
            boardStyle: { borderRadius: "0px" },
            showNotation: false,
            allowDragging: puzzleStatus === "solving",
          }}
        />

        <BoardCoordinates boardOrientation={boardOrientation} />
      </div>

      {/* Below the board: Status indicator */}
      <div className="h-8 flex items-center justify-center z-10">
        {puzzleStatus === "solved" ? (
          <span className="font-mono uppercase tracking-wider text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <Check className="w-3.5 h-3.5" /> Correct Move
          </span>
        ) : puzzleStatus === "failed" || isShaking ? (
          <span className="font-mono uppercase tracking-wider text-xs font-bold text-rose-400 flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full animate-bounce">
            Incorrect. Try Again
          </span>
        ) : (
          <span className="font-mono uppercase tracking-wider text-xs font-bold text-[#e5dfd5] flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            <Play className="w-3.5 h-3.5 text-brand-accent fill-current" />
            {playerColor === "w" ? "White to Move" : "Black to Move"}
          </span>
        )}
      </div>

      {/* Elegant Controls: Hint, Undo, Reset, Next Puzzle */}
      <div className="flex items-center gap-3 sm:gap-4 pt-2 z-10">
        <button
          onClick={() => {
            soundManager.playButtonClick();
            handleHint();
          }}
          disabled={puzzleStatus === "solved"}
          className="px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold bg-white/5 border border-white/10 hover:border-brand-accent/40 text-brand-secondary hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Hint
        </button>

        <button
          onClick={() => {
            soundManager.playButtonClick();
            handleUndo();
          }}
          disabled={!canUndo}
          className="px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold bg-white/5 border border-white/10 hover:border-brand-accent/40 text-brand-secondary hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Undo
        </button>

        <button
          onClick={() => {
            soundManager.playButtonClick();
            handleReset();
          }}
          disabled={!canUndo}
          className="px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold bg-white/5 border border-white/10 hover:border-brand-accent/40 text-brand-secondary hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>

        {onNextPuzzle && (
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onNextPuzzle();
            }}
            className="px-6 py-2.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold btn-premium-cta cta-shine cursor-pointer flex items-center gap-1.5 shadow-md shadow-brand-accent/5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Next Puzzle</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
