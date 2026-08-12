/**
 * MultiplayerBoard.tsx
 *
 * Renders the server-authoritative FEN through the house ThemedChessboard. A locally-predicted
 * "optimistic" position may render briefly after a drop, but it is never the source of truth:
 * the very next server message (accepted or rejected) always wins, and the overlay expires on
 * its own after a short timeout if neither arrives (M5 plan §7.3).
 *
 * The move actually played is derived by diffing the previous server FEN against the new one —
 * both ends run the exact same chess.js version against the exact same starting position, so
 * this is a deterministic read of server truth, not a guess (M5 plan §6.4).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { ThemedChessboard } from "@/shared/ui/ThemedChessboard";
import { BoardCoordinates } from "@/shared/ui/BoardCoordinates";
import { soundManager } from "@/shared/lib/SoundManager";

export interface DerivedMove {
  san: string;
  isOwnMove: boolean;
  isCheck: boolean;
}

interface MoveRejection {
  reason: string;
  id: number;
}

interface MultiplayerBoardProps {
  fen: string;
  boardOrientation: "white" | "black";
  isMyTurn: boolean;
  interactive: boolean;
  moveRejection: MoveRejection | null;
  onSubmitMove: (from: string, to: string, promotion?: string) => void;
  onMoveApplied: (move: DerivedMove) => void;
}

const OPTIMISTIC_TIMEOUT_MS = 3000;
const SHAKE_DURATION_MS = 400;

function findKingSquare(chess: Chess, color: "w" | "b"): string | null {
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell && cell.type === "k" && cell.color === color) return cell.square;
    }
  }
  return null;
}

export function MultiplayerBoard({
  fen,
  boardOrientation,
  isMyTurn,
  interactive,
  moveRejection,
  onSubmitMove,
  onMoveApplied,
}: MultiplayerBoardProps) {
  const [optimisticFen, setOptimisticFen] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [shake, setShake] = useState(false);

  const prevFenRef = useRef(fen);
  const pendingRef = useRef(false);
  const optimisticTimerRef = useRef<number | null>(null);
  const shakeTimerRef = useRef<number | null>(null);

  const clearOptimisticTimer = () => {
    if (optimisticTimerRef.current !== null) {
      window.clearTimeout(optimisticTimerRef.current);
      optimisticTimerRef.current = null;
    }
  };

  const triggerShake = () => {
    setShake(true);
    if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = window.setTimeout(() => setShake(false), SHAKE_DURATION_MS);
  };

  // Server FEN changed — always wins. Discard any optimistic overlay and derive what happened.
  useEffect(() => {
    if (fen === prevFenRef.current) return;
    const wasMyPendingMove = pendingRef.current;

    setOptimisticFen(null);
    clearOptimisticTimer();
    pendingRef.current = false;

    try {
      const before = new Chess(prevFenRef.current);
      const played = before.moves({ verbose: true }).find((m) => {
        const test = new Chess(prevFenRef.current);
        test.move({ from: m.from, to: m.to, promotion: m.promotion });
        return test.fen() === fen;
      });

      if (played) {
        setLastMove({ from: played.from, to: played.to });
        const after = new Chess(fen);
        onMoveApplied({ san: played.san, isOwnMove: wasMyPendingMove, isCheck: after.inCheck() });
      }
    } catch {
      // Derivation is display sugar only — the server FEN is still rendered correctly either way.
    }

    prevFenRef.current = fen;
  }, [fen, onMoveApplied]);

  // A rejected move reverts the overlay and gives tactile feedback — never a toast.
  // Gated against a ref of the last-handled rejection id so it fires exactly once per rejection.
  const handledRejectionIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!moveRejection || moveRejection.id === handledRejectionIdRef.current) return;
    handledRejectionIdRef.current = moveRejection.id;

    setOptimisticFen(null);
    clearOptimisticTimer();
    pendingRef.current = false;
    soundManager.playIllegal();
    triggerShake();
  }, [moveRejection]);

  useEffect(
    () => () => {
      clearOptimisticTimer();
      if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
    },
    []
  );

  const displayFen = optimisticFen ?? fen;

  const checkSquare = useMemo(() => {
    try {
      const chess = new Chess(displayFen);
      return chess.inCheck() ? findKingSquare(chess, chess.turn()) : null;
    } catch {
      return null;
    }
  }, [displayFen]);

  const handlePieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (!interactive || !isMyTurn || !targetSquare) return false;

      let chess: Chess;
      try {
        chess = new Chess(displayFen);
      } catch {
        return false;
      }

      const sourcePiece = chess.get(sourceSquare as Square);
      const targetPiece = chess.get(targetSquare as Square);
      const isCastleGesture =
        sourcePiece?.type === "k" && targetPiece?.type === "r" && targetPiece.color === sourcePiece.color;

      // Chess960 castling gesture: dropping the king onto its own rook means "castle this side"
      // (mirrors the same UI-layer translation the local Stockfish mode already does).
      let actualTarget = targetSquare;
      if (isCastleGesture) {
        const kingFile = sourceSquare.charCodeAt(0);
        const rookFile = targetSquare.charCodeAt(0);
        const rank = sourceSquare[1];
        actualTarget = rookFile > kingFile ? `g${rank}` : `c${rank}`;
      }

      let move;
      try {
        move = chess.move({ from: sourceSquare, to: actualTarget, promotion: "q" });
      } catch {
        move = null;
      }

      if (!move) {
        soundManager.playIllegal();
        triggerShake();
        return false;
      }

      setOptimisticFen(chess.fen());
      setLastMove({ from: sourceSquare, to: actualTarget });
      pendingRef.current = true;

      if (move.flags.includes("k") || move.flags.includes("q")) soundManager.playCastle();
      else if (move.flags.includes("c") || move.flags.includes("e")) soundManager.playCapture();
      else soundManager.playMove();
      if (chess.inCheck()) soundManager.playCheck();

      clearOptimisticTimer();
      optimisticTimerRef.current = window.setTimeout(() => {
        setOptimisticFen(null);
        pendingRef.current = false;
      }, OPTIMISTIC_TIMEOUT_MS);

      onSubmitMove(sourceSquare, actualTarget, move.promotion);
      return true;
    },
    [displayFen, interactive, isMyTurn, onSubmitMove]
  );

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: "rgba(212, 175, 110, 0.35)" };
      styles[lastMove.to] = { backgroundColor: "rgba(212, 175, 110, 0.35)" };
    }
    if (checkSquare) {
      styles[checkSquare] = {
        backgroundColor: "rgba(239, 68, 68, 0.55)",
        boxShadow: "inset 0 0 0 3px #ef4444, 0 0 14px rgba(239, 68, 68, 0.9)",
        borderRadius: "4px",
      };
    }
    return styles;
  }, [lastMove, checkSquare]);

  return (
    <div
      role="application"
      aria-label={`Chess board, ${boardOrientation} orientation, ${isMyTurn ? "your move" : "opponent's move"}`}
      className={`relative w-full max-w-[450px] sm:max-w-[480px] aspect-square rounded-2xl border-2 overflow-hidden bg-brand-surface transition-colors duration-300 ${
        shake ? "border-rose-500/80" : "border-brand-accent/40 hover:border-brand-accent/60"
      } ${!isMyTurn ? "[&_[data-testid^='piece-']]:!cursor-default" : ""}`}
    >
      <ThemedChessboard
        options={{
          position: displayFen,
          onPieceDrop: ({ sourceSquare, targetSquare }) => handlePieceDrop(sourceSquare, targetSquare ?? ""),
          boardOrientation,
          squareStyles,
          boardStyle: { borderRadius: "12px" },
          showNotation: false,
          allowDragging: interactive && isMyTurn,
        }}
      />
      <BoardCoordinates boardOrientation={boardOrientation} />
    </div>
  );
}
