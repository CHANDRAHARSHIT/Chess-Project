import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { PuzzleBoard } from "@/features/puzzles/components/PuzzleBoard";
import { PuzzleApiService } from "@/features/puzzles/puzzle.service";
import type { CuratedPuzzle } from "@/features/puzzles/puzzle.types";
import type { ChessPuzzle } from "@/features/puzzles/puzzleLoader";
import { useStoryModeRun } from "./StoryModeContext";
import { Chess } from "chess.js";
import { Loader2, Swords, Trophy, RotateCcw } from "lucide-react";

import { FALLBACK_PUZZLES } from "@/shared/appearance/fallbackPuzzles";
// Convert Lichess to ChessPuzzle
function convertPuzzle(raw: CuratedPuzzle): ChessPuzzle {
  const moveList = raw.moves.split(" ").filter(Boolean);
  const game = new Chess(raw.fen);
  try {
    game.move({
      from: moveList[0].slice(0, 2),
      to: moveList[0].slice(2, 4),
      promotion: moveList[0][4] ?? undefined,
    });
  } catch {}
  const puzzleFen = game.fen();
  const playerSolution = moveList.slice(1).join(" ");
  return {
    id: raw.id,
    fen: puzzleFen,
    solution: playerSolution,
    rating: raw.rating,
  };
}

interface StoryModePuzzleNodeProps {
  nodeLabel: string;
  difficulty: number;
  onComplete: () => void;
  onRetreat: () => void;
}

export default function StoryModePuzzleNode({
  nodeLabel,
  difficulty,
  onComplete,
  onRetreat,
}: StoryModePuzzleNodeProps) {
  const { runState, updateRunState } = useStoryModeRun();
  const [puzzles, setPuzzles] = useState<CuratedPuzzle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodeComplete, setNodeComplete] = useState(false);

  // Difficulty mapping:
  // 1 = 800 - 1200
  // 2 = 1200 - 1600
  // 3 = 1600 - 2000
  // 4+ = 2000 - 2400
  
  useEffect(() => {
    let cancelled = false;

    async function fetchPuzzles() {
      setLoading(true);
      setError(null);
      try {
        const minRating = difficulty === 1 ? 800 : difficulty === 2 ? 1200 : difficulty === 3 ? 1600 : 2000;
        const maxRating = minRating + 400;

        const data = await PuzzleApiService.getPuzzles({ minRating, maxRating });
        if (cancelled) return;

        if (data.length === 0) {
          // If the database is empty, use our guaranteed fallback puzzles
          const shuffled = [...FALLBACK_PUZZLES].sort(() => 0.5 - Math.random());
          setPuzzles(shuffled.slice(0, 5));
        } else {
          // Shuffle and pick 5
          const shuffled = [...data].sort(() => 0.5 - Math.random());
          setPuzzles(shuffled.slice(0, 5));
        }
      } catch {
        if (!cancelled) setError("Failed to load puzzles.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPuzzles();
    return () => { cancelled = true; };
  }, [difficulty]);

  const currentPuzzle = puzzles[currentIndex];
  const chessPuzzle = useMemo(() => currentPuzzle ? convertPuzzle(currentPuzzle) : null, [currentPuzzle]);

  const handleWin = useCallback(() => {
    if (!nodeComplete) {
      setNodeComplete(true);
      // Reward coins based on difficulty
      const reward = difficulty * 20;
      updateRunState({ coins: runState.coins + reward });
    }
  }, [nodeComplete, difficulty, runState.coins, updateRunState]);

  const handleNextPuzzle = useCallback(() => {
    if (currentIndex < puzzles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleWin();
    }
  }, [currentIndex, puzzles.length, handleWin]);

  useEffect(() => {
    if (puzzles.length > 0 && currentIndex >= puzzles.length) {
      handleWin();
    }
  }, [currentIndex, puzzles.length, handleWin]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 flex-1">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin mb-4" />
        <p className="text-brand-secondary font-mono text-sm">Loading Trial Puzzles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 gap-4 flex-1">
        <p className="text-red-400 font-mono text-sm">{error}</p>
        <button onClick={onRetreat} className="px-4 py-2 border border-brand-border rounded text-brand-secondary hover:text-brand-text">
          Retreat
        </button>
      </div>
    );
  }

  if (nodeComplete) {
    return (
      <motion.div
        className="flex items-center justify-center p-4 sm:p-6 flex-1"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        <div className="max-w-md w-full flex flex-col items-center gap-6 py-8 px-6 rounded-2xl border border-green-500/30 bg-green-500/10 backdrop-blur-sm shadow-xl">
          <Trophy className="w-12 h-12 text-green-400" />
          <div className="text-center">
            <h2 className="text-2xl font-display font-bold text-brand-text">Trial Complete!</h2>
            <p className="text-sm text-brand-secondary mt-2">You solved all the puzzles.</p>
          </div>
          <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-lg border border-yellow-500/40">
            <span className="text-yellow-400 font-bold font-mono" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>+{difficulty * 20} Coins</span>
          </div>
          <button
            onClick={onComplete}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 transition-all font-medium cursor-pointer"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
          >
            Continue Journey
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col lg:flex-row items-center justify-center gap-2 p-1 sm:p-2 flex-1 min-h-0 w-full"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-[500px] mx-auto flex flex-col gap-2 h-fit max-h-full my-auto">
        {/* Header */}
        <div className="flex items-center justify-between bg-brand-surface/30 p-4 rounded-xl border border-brand-border/40 shrink-0">
          <div className="flex items-center gap-3">
            <Swords className="w-5 h-5 text-brand-accent" />
            <div>
              <h2 className="text-lg font-bold text-brand-text leading-tight">{nodeLabel}</h2>
              <p className="text-xs text-brand-secondary">Solve the puzzle to proceed.</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-brand-surface/50 border border-brand-border/50 rounded-lg text-sm font-mono text-brand-text font-bold">
            {currentIndex + 1} / {puzzles.length}
          </div>
        </div>

        {/* Board */}
        {chessPuzzle && (
          <div className="bg-brand-surface/20 p-1 sm:p-2 rounded-2xl border border-brand-border/40 backdrop-blur-sm min-h-0 flex flex-col justify-center">
            <PuzzleBoard
              puzzle={chessPuzzle}
              puzzleNumber={currentIndex + 1}
              onNextPuzzle={handleNextPuzzle}
              isNextDisabled={undefined}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
          <button
            onClick={onRetreat}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border/60 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 transition-all text-xs font-medium cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Retreat (Lose Progress)
          </button>
          {import.meta.env.DEV && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleWin}
                className="px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold hover:bg-emerald-500/30 cursor-pointer"
              >
                [DEV] Win
              </button>
              <button
                onClick={onRetreat}
                className="px-3 py-1.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold hover:bg-rose-500/30 cursor-pointer"
              >
                [DEV] Lose
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
