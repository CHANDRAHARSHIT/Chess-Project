import { useState, useRef, useCallback, useEffect } from "react";
import { ThemedChessboard } from "@/shared/ui/ThemedChessboard";
import { Chess } from "chess.js";
import type { Square } from "chess.js";
import type { ChessPuzzle } from "@/features/puzzles/puzzleLoader";
import { validateMove } from "@/features/puzzles/puzzleValidator";
import {
  HelpCircle,
  RotateCcw,
  ArrowRight,
  Play,
  Check,
  Undo2,
} from "lucide-react";
import { soundManager } from "@/shared/lib/SoundManager";
import { BoardCoordinates } from "@/shared/ui/BoardCoordinates";
import rollbar from "@/shared/lib/rollbar";

export interface PuzzleBoardProps {
  puzzle: ChessPuzzle;
  puzzleNumber?: string | number;
  boardId?: string;
  onSolved?: () => void;
  onFailed?: () => void;
  onNextPuzzle?: () => void;
  isNextDisabled?: boolean;
}

export function PuzzleBoard({
  puzzle,
  puzzleNumber,
  onSolved,
  onFailed,
  onNextPuzzle,
  isNextDisabled,
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

  // Reset board and status when the puzzle prop changes
  useEffect(() => {
    function resetBoard() {
      try {
        gameRef.current = new Chess(puzzle.fen);
        setGameFen(puzzle.fen);
      } catch (e) {
        console.error("Failed to parse FEN in PuzzleBoard:", puzzle.fen, e);
        // Falls back to a fresh board below, so this never reaches the
        // ErrorBoundary — report it manually since it points at bad puzzle data.
        rollbar.error(e as Error, { context: "PuzzleBoard.resetBoard", fen: puzzle.fen });
        gameRef.current = new Chess();
        setGameFen(gameRef.current.fen());
      }
      setSolutionIndex(0);
      setPuzzleStatus("solving");
      setLastMove(null);
      setIsShaking(false);
      setErrorSquares(null);
      setHintSquare(null);
    }
    resetBoard();
  }, [puzzle.id, puzzle.fen]);

  // Lock orientation to the puzzle's STARTING FEN — not the live gameFen.
  // gameFen changes color after every half-move, which would flip the board
  // during the 400ms window between the player's move and the opponent's
  // auto-reply in multi-move puzzles. puzzle.fen only changes when a new
  // puzzle loads, so orientation stays stable for the entire puzzle session.
  const playerColor = (puzzle.fen.split(" ")[1] ?? "w") as "w" | "b";
  const boardOrientation = playerColor === "w" ? "white" : "black";

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      // Ignore drops if the puzzle is already solved
      if (puzzleStatus === "solved") {
        return false;
      }

      const game = gameRef.current;

      // 1. Enforce that the piece belongs to the active side
      const piece = game.get(sourceSquare as Square);
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
                    // A genuine bug (bad puzzle solution data or move parsing),
                    // not user input — report it manually.
                    rollbar.error(e as Error, {
                      context: "PuzzleBoard.playOpponentMove",
                      oppMoveStr,
                    });
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

  // Derive canUndo from state (gameFen) instead of reading the ref during render.
  // If gameFen differs from the puzzle start FEN, at least one move was made.
  const canUndo = gameFen !== puzzle.fen;

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

  const isNextBtnDisabled = isNextDisabled !== undefined ? isNextDisabled : (puzzleStatus !== "solved");

  return (
    <div className="flex flex-col items-center gap-1 sm:gap-2 w-full flex-1 min-h-0">
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
        className={`relative aspect-square border overflow-hidden bg-brand-surface transition-all duration-300 z-10 ${isShaking
          ? "border-rose-500 ring-4 ring-rose-500/25"
          : puzzleStatus === "solved"
            ? "border-emerald-500 ring-4 ring-emerald-500/25 animate-pulse"
            : "border-[rgba(212,175,110,0.80)]"
          }`}
        style={{ transform: "translateZ(0)", height: "100%", maxHeight: "100%", maxWidth: "100%" }}
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
          <span className="font-mono uppercase tracking-wider text-xs font-bold text-brand-text flex items-center gap-1.5 bg-brand-surface border border-brand-border/60 px-3 py-1 rounded-full">
            <Play className="w-3.5 h-3.5 text-brand-accent fill-current" />
            {playerColor === "w" ? "White to Move" : "Black to Move"}
          </span>
        )}
      </div>

      {/* Elegant Controls: Hint, Undo, Reset, Next Puzzle */}
      <div className="w-full max-w-[500px] sm:max-w-none flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-4 pt-2 z-10">
        <button
          onClick={() => {
            soundManager.playButtonClick();
            handleHint();
          }}
          disabled={puzzleStatus === "solved"}
          className="flex-1 min-w-[70px] sm:flex-initial px-2.5 sm:px-5 py-2.5 min-h-[44px] justify-center rounded-xl font-mono text-xs uppercase tracking-wider font-semibold bg-brand-surface border border-brand-border/60 hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
        >
          <HelpCircle className="w-3.5 h-3.5 text-brand-accent" />
          <span>Hint</span>
        </button>

        <button
          onClick={() => {
            soundManager.playButtonClick();
            handleUndo();
          }}
          disabled={!canUndo}
          className="flex-1 min-w-[70px] sm:flex-initial px-2.5 sm:px-5 py-2.5 min-h-[44px] justify-center rounded-xl font-mono text-xs uppercase tracking-wider font-semibold bg-brand-surface border border-brand-border/60 hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
        >
          <Undo2 className="w-3.5 h-3.5 text-brand-accent" />
          <span>Undo</span>
        </button>

        <button
          onClick={() => {
            soundManager.playButtonClick();
            handleReset();
          }}
          disabled={!canUndo}
          className="flex-1 min-w-[70px] sm:flex-initial px-2.5 sm:px-5 py-2.5 min-h-[44px] justify-center rounded-xl font-mono text-xs uppercase tracking-wider font-semibold bg-brand-surface border border-brand-border/60 hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-brand-accent" />
          <span>Reset</span>
        </button>

        {onNextPuzzle && (
          <button
            onClick={() => {
              if (isNextBtnDisabled) return;
              soundManager.playButtonClick();
              onNextPuzzle();
            }}
            disabled={isNextBtnDisabled}
            className={`w-full sm:w-auto sm:flex-initial px-4 sm:px-6 py-2.5 min-h-[44px] justify-center rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-all duration-300 flex items-center gap-1.5 ${isNextBtnDisabled
              ? "opacity-40 bg-brand-surface border border-brand-border/60 text-brand-secondary cursor-not-allowed"
              : "btn-premium-cta cta-shine cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              }`}
          >
            <span>Next Puzzle</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
