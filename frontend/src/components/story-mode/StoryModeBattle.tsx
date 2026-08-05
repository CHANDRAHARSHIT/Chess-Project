/**
 * StoryModeBattle.tsx
 *
 * Full chess battle screen for story mode monster/boss encounters.
 * Reuses the existing useStockfish hook, ThemedChessboard, and chess.js
 * for the actual chess gameplay. Wraps it in an atmospheric battle UI
 * with monster info, health-bar-style difficulty indicator, move log,
 * and victory/defeat overlays.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chess } from "chess.js";
import { ThemedChessboard } from "../ThemedChessboard";
import { useStockfish } from "../../hooks/useStockfish";
import {
  parseUciMove,
  getGameOverReason,
  playMoveSound,
} from "../../utils/chessHelpers";
import { EvaluationBar } from "../EvaluationBar";
import { soundManager } from "../../utils/SoundManager";
import {
  MONSTER_PROFILES,
  type MonsterProfile,
} from "../../data/storyModeMapData";
import type { DifficultyLevel } from "../../types/chess";
import {
  Swords,
  Trophy,
  Skull,
  RotateCcw,
  ArrowLeft,
  CornerUpLeft,
  Lightbulb,
} from "lucide-react";

interface StoryModeBattleProps {
  nodeId: number;
  difficulty: DifficultyLevel;
  onVictory: () => void;
  onDefeat: () => void;
  onRetreat: () => void;
}

export default function StoryModeBattle({
  nodeId,
  difficulty,
  onVictory,
  onDefeat,
  onRetreat,
}: StoryModeBattleProps) {
  // ── Game state ────────────────────────────────────────────────────────────
  const gameRef = useRef(new Chess());
  const [gameFen, setGameFen] = useState(() => gameRef.current.fen());
  const [playerColor] = useState<"w" | "b">("w");
  const [boardOrientation] = useState<"white" | "black">("white");
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Result tracking
  const [battleResult, setBattleResult] = useState<
    "playing" | "victory" | "defeat"
  >("playing");

  // Monster profile
  const monster: MonsterProfile = MONSTER_PROFILES[nodeId] ?? {
    name: "Unknown Foe",
    title: "Mysterious Challenger",
    rating: "???",
    icon: "♟",
  };

  // ── Stockfish ─────────────────────────────────────────────────────────────
  const {
    evaluation,
    bestMove,
    isThinking,
    getEngineMove,
    analyzePosition,
    stopSearch,
    resetEvaluation,
  } = useStockfish();

  // Move history container
  const moveHistoryRef = useRef<HTMLDivElement>(null);

  // ── Game-over detection ───────────────────────────────────────────────────
  useEffect(() => {
    const reason = getGameOverReason(gameRef.current);
    setGameOverReason(reason);

    if (reason) {
      soundManager.playGameEnd();
      const game = gameRef.current;

      if (game.isCheckmate()) {
        // If it's the AI's turn after checkmate, that means the player delivered checkmate
        const aiLost = game.turn() !== playerColor;
        setBattleResult(aiLost ? "victory" : "defeat");
      } else {
        // Draws count as defeat in story mode — you must win to advance
        setBattleResult("defeat");
      }
    }
  }, [gameFen, playerColor]);

  // ── AI move trigger ───────────────────────────────────────────────────────
  useEffect(() => {
    const game = gameRef.current;
    if (game.isGameOver()) return;
    if (game.turn() === playerColor) return;

    const timer = setTimeout(() => {
      getEngineMove(game.fen(), difficulty, (bestMoveStr) => {
        const { from, to, promotion } = parseUciMove(bestMoveStr);
        try {
          const move = gameRef.current.move({
            from,
            to,
            promotion: promotion || "q",
          });
          if (move) {
            setGameFen(gameRef.current.fen());
            playMoveSound(gameRef.current, move.flags, !!move.captured);
          }
        } catch (e) {
          console.error("AI tried invalid move:", bestMoveStr, e);
        }
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [gameFen, playerColor, difficulty, getEngineMove]);

  // ── Scroll move history ───────────────────────────────────────────────────
  useEffect(() => {
    if (moveHistoryRef.current) {
      moveHistoryRef.current.scrollTop = moveHistoryRef.current.scrollHeight;
    }
  }, [gameFen]);

  // Auto-dismiss hint
  useEffect(() => {
    if (showHint && bestMove) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => setShowHint(false), 4000);
    }
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [showHint, bestMove]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string | null): boolean => {
      const game = gameRef.current;
      if (game.isGameOver()) return false;
      if (game.turn() !== playerColor) return false;
      if (!targetSquare) return false;

      try {
        const move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });
        if (move) {
          setGameFen(game.fen());
          setShowHint(false);
          if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
          playMoveSound(game, move.flags, !!move.captured);
          return true;
        }
      } catch {
        // illegal move
      }
      return false;
    },
    [playerColor]
  );

  const handleUndo = useCallback(() => {
    const game = gameRef.current;
    if (game.history().length === 0) return;
    game.undo();
    if (game.history().length > 0 && game.turn() !== playerColor) {
      game.undo();
    }
    setGameFen(game.fen());
    setShowHint(false);
    stopSearch();
    soundManager.playMove();
  }, [playerColor, stopSearch]);

  const handleHint = useCallback(() => {
    setShowHint(true);
    analyzePosition(gameRef.current.fen());
  }, [analyzePosition]);

  const handleRetry = useCallback(() => {
    stopSearch();
    gameRef.current = new Chess();
    setGameFen(gameRef.current.fen());
    setShowHint(false);
    setGameOverReason(null);
    setBattleResult("playing");
    resetEvaluation();
    soundManager.playGameStart();
  }, [stopSearch, resetEvaluation]);

  // ── Hint arrow overlay ────────────────────────────────────────────────────
  const customArrows: [string, string][] = [];
  if (showHint && bestMove) {
    const { from, to } = parseUciMove(bestMove);
    customArrows.push([from, to]);
  }

  // ── Move history ──────────────────────────────────────────────────────────
  const history = gameRef.current.history({ verbose: true });
  const movePairs: {
    num: number;
    white: (typeof history)[0];
    black?: (typeof history)[0];
  }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  // ── Start sound ───────────────────────────────────────────────────────────
  useEffect(() => {
    soundManager.playGameStart();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="w-full flex flex-col items-center gap-4 py-4 px-2 sm:px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Monster header */}
      <motion.div
        className="flex flex-col items-center gap-2 text-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{monster.icon}</span>
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-text">
              {monster.name}
            </h2>
            <p className="text-xs font-mono text-brand-secondary">
              {monster.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Swords className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-mono text-red-400">
            Rating {monster.rating}
          </span>
          <span className="text-xs text-brand-secondary">•</span>
          <span className="text-xs font-mono text-brand-secondary">
            Difficulty {difficulty}/5
          </span>
        </div>
      </motion.div>

      {/* Battle area */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-4 w-full max-w-5xl">
        {/* Evaluation bar */}
        <div className="hidden lg:flex items-center" style={{ height: 440 }}>
          <EvaluationBar
            evaluation={evaluation}
            boardHeight={440}
            orientation={boardOrientation}
          />
        </div>

        {/* Chessboard */}
        <motion.div
          className="w-full max-w-[480px] mx-auto"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <ThemedChessboard
            options={{
              position: gameFen,
              onPieceDrop: onDrop,
              boardOrientation,
              boardWidth: 480,
              animationDuration: 200,
              arePiecesDraggable: battleResult === "playing",
              customArrows,
              customArrowColor: "rgba(34,197,94,0.6)",
            }}
          />

          {/* Thinking indicator */}
          {isThinking && (
            <motion.div
              className="flex items-center justify-center gap-2 mt-2 py-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-red-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
              <span className="text-xs font-mono text-brand-secondary">
                {monster.name} is thinking…
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Side panel: move log + controls */}
        <motion.div
          className="w-full lg:w-64 flex flex-col gap-3"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Game status */}
          {gameOverReason && (
            <div className="px-3 py-2 rounded-lg bg-brand-accent/10 border border-brand-accent/30 text-sm font-mono text-brand-accent text-center">
              {gameOverReason}
            </div>
          )}

          {/* Move log */}
          <div
            ref={moveHistoryRef}
            className="flex-1 max-h-64 lg:max-h-80 overflow-y-auto rounded-xl border border-brand-border/20 bg-brand-surface/30 backdrop-blur-sm"
          >
            <div className="sticky top-0 px-3 py-2 border-b border-brand-border/20 bg-brand-surface/80 backdrop-blur-sm">
              <span className="text-xs font-mono text-brand-secondary uppercase tracking-wider">
                Moves
              </span>
            </div>
            <div className="p-2">
              {movePairs.length === 0 ? (
                <p className="text-xs text-brand-secondary/50 text-center py-4">
                  Make your first move…
                </p>
              ) : (
                movePairs.map((pair) => (
                  <div
                    key={pair.num}
                    className="flex items-center gap-1 py-0.5 text-xs font-mono"
                  >
                    <span className="w-6 text-brand-secondary/50 text-right">
                      {pair.num}.
                    </span>
                    <span className="w-14 text-brand-text">{pair.white.san}</span>
                    <span className="w-14 text-brand-secondary">
                      {pair.black?.san ?? ""}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleUndo}
              disabled={
                battleResult !== "playing" ||
                gameRef.current.history().length === 0
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand-border/40 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-medium cursor-pointer"
            >
              <CornerUpLeft className="w-3.5 h-3.5" />
              Undo
            </button>
            <button
              onClick={handleHint}
              disabled={
                battleResult !== "playing" || isThinking || showHint
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand-border/40 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-medium cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Hint
            </button>
            <button
              onClick={onRetreat}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand-border/40 text-brand-secondary hover:text-brand-text hover:border-red-500/40 transition-all text-xs font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Retreat
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── Victory / Defeat overlay ──────────────────────────────────────── */}
      <AnimatePresence>
        {battleResult !== "playing" && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex flex-col items-center gap-5 p-8 rounded-2xl border max-w-sm w-full mx-4"
              style={{
                background:
                  battleResult === "victory"
                    ? "rgba(34, 197, 94, 0.08)"
                    : "rgba(239, 68, 68, 0.08)",
                borderColor:
                  battleResult === "victory"
                    ? "rgba(34, 197, 94, 0.3)"
                    : "rgba(239, 68, 68, 0.3)",
              }}
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              {/* Icon */}
              <motion.div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background:
                    battleResult === "victory"
                      ? "rgba(34, 197, 94, 0.15)"
                      : "rgba(239, 68, 68, 0.15)",
                  border: `2px solid ${
                    battleResult === "victory"
                      ? "rgba(34, 197, 94, 0.4)"
                      : "rgba(239, 68, 68, 0.4)"
                  }`,
                }}
                animate={{
                  boxShadow:
                    battleResult === "victory"
                      ? [
                          "0 0 20px rgba(34,197,94,0.2)",
                          "0 0 40px rgba(34,197,94,0.4)",
                          "0 0 20px rgba(34,197,94,0.2)",
                        ]
                      : [
                          "0 0 20px rgba(239,68,68,0.2)",
                          "0 0 40px rgba(239,68,68,0.4)",
                          "0 0 20px rgba(239,68,68,0.2)",
                        ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {battleResult === "victory" ? (
                  <Trophy className="w-10 h-10 text-green-400" />
                ) : (
                  <Skull className="w-10 h-10 text-red-400" />
                )}
              </motion.div>

              {/* Text */}
              <div className="text-center">
                <h3
                  className="text-2xl font-display font-bold"
                  style={{
                    color:
                      battleResult === "victory" ? "#4ade80" : "#f87171",
                  }}
                >
                  {battleResult === "victory"
                    ? "Victory!"
                    : "Defeated"}
                </h3>
                <p className="text-sm text-brand-secondary mt-1">
                  {battleResult === "victory"
                    ? `You defeated ${monster.name}! The path ahead opens.`
                    : `${monster.name} has bested you. Try again?`}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-2">
                {battleResult === "defeat" && (
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-all text-sm font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry
                  </button>
                )}
                <button
                  onClick={
                    battleResult === "victory" ? onVictory : onRetreat
                  }
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-all"
                  style={{
                    borderColor:
                      battleResult === "victory"
                        ? "rgba(34, 197, 94, 0.4)"
                        : "rgba(120,120,140,0.4)",
                    background:
                      battleResult === "victory"
                        ? "rgba(34, 197, 94, 0.1)"
                        : "transparent",
                    color:
                      battleResult === "victory"
                        ? "#4ade80"
                        : "rgba(180,180,190,0.8)",
                  }}
                >
                  {battleResult === "victory" ? (
                    <>
                      <Trophy className="w-4 h-4" />
                      Continue Journey
                    </>
                  ) : (
                    <>
                      <ArrowLeft className="w-4 h-4" />
                      Back to Map
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
