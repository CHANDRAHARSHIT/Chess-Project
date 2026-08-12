/**
 * useOpeningTrainer.ts
 *
 * Core trainer logic for the interactive opening trainer.
 *
 * Given an Opening record from the backend (with a `moves` string like
 * "e4 e5 Nf3 Nc6 Bc4"), this hook drives a chess.js game step-by-step:
 *
 *   - White moves first (user plays white).
 *   - After every user move it checks the move against the sequence.
 *   - If correct it advances; opponent moves are auto-played after a delay.
 *   - Wrong moves flash the "wrong" status briefly, then revert to "playing".
 *   - When all moves are done, status becomes "complete".
 *
 * Returns everything OpeningsPage needs: fen, squareStyles, handlers, status.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import type { Opening } from "@/types/opening";
import { soundManager } from "@/utils/SoundManager";

export type TrainerStatus =
  | "idle"       // No opening selected yet
  | "playing"    // Waiting for the user to play
  | "opponent"   // Opponent move is being auto-played
  | "wrong"      // User played a wrong move
  | "complete";  // All moves played

export interface TrainerState {
  fen: string;
  boardOrientation: "white" | "black";
  status: TrainerStatus;
  /** Index into the sanMoves array of the NEXT move to be played */
  currentStepIndex: number;
  /** Total number of moves in the opening sequence */
  totalSteps: number;
  /** 0–1 progress fraction */
  progress: number;
  /** Message shown in the coach panel */
  coachMessage: string;
  /** Square highlight styles for react-chessboard */
  squareStyles: Record<string, React.CSSProperties>;
  /** Called by OpeningBoard when the user drags a piece */
  onPieceDrop: (sourceSquare: string, targetSquare: string) => boolean;
  /** Reset the trainer to the start of the current opening */
  reset: () => void;
  /** SAN moves played so far (both user and opponent) */
  movesPlayed: string[];
}

const OPPONENT_DELAY_MS = 500;

/** Build highlight styles for the expected next move */
function buildHintStyles(from: string, to: string): Record<string, React.CSSProperties> {
  const accentGold = "rgba(200, 132, 16, 0.55)";
  const accentGoldEdge = "rgba(124, 82, 7, 0.85)";
  return {
    [from]: {
      backgroundColor: accentGold,
      boxShadow: `inset 0 0 0 3px ${accentGoldEdge}`,
      borderRadius: "4px",
    },
    [to]: {
      backgroundColor: accentGold,
      boxShadow: `inset 0 0 0 3px ${accentGoldEdge}`,
      borderRadius: "4px",
    },
  };
}

/** Parse the space-separated `moves` string into an array of SAN moves */
function parseMoves(movesString: string): string[] {
  return movesString
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/** Generate a coach message for the given step index */
function getCoachMessage(
  stepIndex: number,
  sanMoves: string[],
  status: TrainerStatus
): string {
  if (status === "complete") {
    return "Excellent! You've completed this opening. Well done!";
  }
  if (status === "wrong") {
    return "That's not the move — try again! Look at the highlighted squares.";
  }
  if (status === "opponent") {
    return "Opponent is responding…";
  }
  if (sanMoves.length === 0) return "Select an opening to start training.";
  if (stepIndex === 0) {
    return `Let's learn this opening! Make the highlighted move to begin.`;
  }
  if (stepIndex < sanMoves.length) {
    return `Great! Now play the next highlighted move.`;
  }
  return "Well played!";
}

export function useOpeningTrainer(opening: Opening | null): TrainerState {
  const sanMoves = opening ? parseMoves(opening.moves) : [];
  const totalSteps = sanMoves.length;

  const gameRef = useRef<Chess>(new Chess());
  const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const [fen, setFen] = useState<string>(STARTING_FEN);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [status, setStatus] = useState<TrainerStatus>("idle");
  const [movesPlayed, setMovesPlayed] = useState<string[]>([]);
  const [squareStyles, setSquareStyles] = useState<Record<string, React.CSSProperties>>({});

  /** Compute highlight for the current expected move */
  const computeHint = useCallback(
    (stepIdx: number): Record<string, React.CSSProperties> => {
      if (!opening || stepIdx >= sanMoves.length) return {};
      const expectedSan = sanMoves[stepIdx];
      const game = gameRef.current;
      const legalMoves = game.moves({ verbose: true });
      const found = legalMoves.find((m) => m.san === expectedSan);
      if (!found) return {};
      return buildHintStyles(found.from, found.to);
    },
    [opening, sanMoves]
  );

  /** Full reset: new chess game, index back to 0, show first hint */
  const reset = useCallback(() => {
    const freshGame = new Chess();
    gameRef.current = freshGame;
    setFen(freshGame.fen());
    setCurrentStepIndex(0);
    setMovesPlayed([]);
    if (opening) {
      setStatus("playing");
      setSquareStyles(computeHint(0));
    } else {
      setStatus("idle");
      setSquareStyles({});
    }
  }, [opening, computeHint]);

  /** When the selected opening changes, reset the trainer */
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opening?.id]);

  /** Auto-play opponent moves after a short delay */
  const playOpponentMove = useCallback(
    (stepIdx: number) => {
      if (stepIdx >= sanMoves.length) {
        setStatus("complete");
        setSquareStyles({});
        soundManager.playApplause();
        return;
      }

      const expectedSan = sanMoves[stepIdx];
      setStatus("opponent");
      setSquareStyles({});

      setTimeout(() => {
        const game = gameRef.current;
        try {
          const move = game.move(expectedSan);
          if (!move) {
            setStatus("complete");
            return;
          }
          const nextFen = game.fen();
          setFen(nextFen);
          setMovesPlayed((prev) => [...prev, move.san]);
          soundManager.playMove();

          const nextIdx = stepIdx + 1;
          setCurrentStepIndex(nextIdx);

          if (nextIdx >= sanMoves.length) {
            setStatus("complete");
            setSquareStyles({});
            soundManager.playApplause();
          } else {
            setStatus("playing");
            setSquareStyles(computeHint(nextIdx));
          }
        } catch {
          setStatus("complete");
        }
      }, OPPONENT_DELAY_MS);
    },
    [sanMoves, computeHint]
  );

  const onPieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (status !== "playing" || !opening) return false;

      const game = gameRef.current;
      let move: ReturnType<typeof game.move> | null = null;

      try {
        move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });
      } catch {
        soundManager.playIllegal();
        return false;
      }

      if (!move) {
        soundManager.playIllegal();
        return false;
      }

      const expectedSan = sanMoves[currentStepIndex];

      if (move.san !== expectedSan) {
        // Wrong move — undo and flash wrong status
        game.undo();
        soundManager.playIllegal();
        setStatus("wrong");
        // Revert FEN (don't update) and reset highlights
        setSquareStyles({});
        setTimeout(() => {
          setStatus("playing");
          setSquareStyles(computeHint(currentStepIndex));
        }, 800);
        return false;
      }

      // Correct user move
      const nextFen = game.fen();
      setFen(nextFen);
      setMovesPlayed((prev) => [...prev, move.san]);

      // Play sound based on move type
      if (game.isCheckmate()) soundManager.playCheckmate();
      else if (game.inCheck()) soundManager.playCheck();
      else if (move.flags.includes("k") || move.flags.includes("q")) soundManager.playCastle();
      else if (move.flags.includes("p")) soundManager.playPromote();
      else if (move.captured) soundManager.playCapture();
      else soundManager.playMove();

      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);

      if (nextIdx >= sanMoves.length) {
        setStatus("complete");
        setSquareStyles({});
        soundManager.playApplause();
      } else {
        // Check if the next move is an opponent move (black, since user plays white)
        const nextIsOpponent = game.turn() === "b";
        if (nextIsOpponent) {
          playOpponentMove(nextIdx);
        } else {
          setStatus("playing");
          setSquareStyles(computeHint(nextIdx));
        }
      }

      return true;
    },
    [status, opening, sanMoves, currentStepIndex, computeHint, playOpponentMove]
  );

  const progress = totalSteps === 0 ? 0 : currentStepIndex / totalSteps;

  const coachMessage = getCoachMessage(currentStepIndex, sanMoves, status);

  return {
    fen,
    boardOrientation: "white",
    status,
    currentStepIndex,
    totalSteps,
    progress,
    coachMessage,
    squareStyles,
    onPieceDrop,
    reset,
    movesPlayed,
  };
}
