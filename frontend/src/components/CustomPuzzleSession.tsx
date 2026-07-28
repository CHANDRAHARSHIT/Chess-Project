import { useState, useCallback, useEffect, useMemo } from "react";
import { Chess } from "chess.js";
import { PuzzleBoard } from "./PuzzleBoard";
import { PuzzleApiService } from "../services/puzzle.service";
import type { CuratedPuzzle } from "../types/puzzle";
import type { PuzzleFilters } from "../types/puzzle";
import type { ChessPuzzle } from "../utils/PuzzleLoader";
import {
  Trophy,
  Zap,
  ArrowLeft,
  BookOpen,
  Loader2,
  CheckCircle2,
  PartyPopper,
  Tag,
} from "lucide-react";

interface CustomPuzzleSessionProps {
  filters: PuzzleFilters;
  onExit: () => void;
}

/**
 * Converts a CuratedPuzzle (from Lichess format) into a ChessPuzzle
 * compatible with the existing PuzzleBoard component.
 *
 * Lichess puzzle FEN: the position is from the OPPONENT's perspective.
 * The `moves` field starts with the opponent's move, then the player's move(s).
 *
 * For a single-move puzzle solution (after the first opponent move), we:
 *   1. Apply the first move from the Lichess FEN to get the "puzzle start" position
 *   2. Use the second move (index 1) as the "solution"
 *
 * For multi-move puzzles (moves.length > 2), we keep track of the full move list
 * and step through it. PuzzleBoard only validates a single move, so we use
 * the FIRST player move as the solution for now (simplest compatible approach).
 */
function convertPuzzle(raw: CuratedPuzzle): ChessPuzzle {
  const moveList = raw.moves.split(" ").filter(Boolean);
  // Apply the first move (opponent's move) to reach the puzzle position
  const game = new Chess(raw.fen);
  try {
    game.move({
      from: moveList[0].slice(0, 2),
      to: moveList[0].slice(2, 4),
      promotion: moveList[0][4] ?? undefined,
    });
  } catch {
    // If applying the first move fails, fall back to raw FEN
  }

  const puzzleFen = game.fen();
  // The player must play the first move in the remaining list
  const playerSolution = moveList.slice(1).join(" ");

  return {
    id: raw.id,
    fen: puzzleFen,
    solution: playerSolution,
    rating: raw.rating,
  };
}

function formatThemeLabel(tag: string): string {
  return tag.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

export function CustomPuzzleSession({ filters, onExit }: CustomPuzzleSessionProps) {
  const [puzzles, setPuzzles] = useState<CuratedPuzzle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionSolved, setSessionSolved] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Fetch puzzles on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    PuzzleApiService.getPuzzles(filters)
      .then((data) => {
        if (data.length === 0) {
          setError("No puzzles found for the selected filters. Try adjusting your rating range or themes.");
        } else {
          setPuzzles(data);
        }
      })
      .catch(() => setError("Failed to load puzzles. Please check your connection."))
      .finally(() => setLoading(false));
  }, [filters]);

  const handleSolved = useCallback(() => {
    setSessionSolved((prev) => prev + 1);
    setSessionStreak((prev) => prev + 1);
  }, []);

  const handleFailed = useCallback(() => {
    setSessionStreak(0);
  }, []);

  const handleNextPuzzle = useCallback(() => {
    if (currentIndex >= puzzles.length - 1) {
      setSessionComplete(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, puzzles.length]);

  // ─── Memoize current puzzle (MUST be before any early returns to follow Rules of Hooks) ───
  const currentRawPuzzle = puzzles[currentIndex];
  const currentPuzzle = useMemo(() => {
    if (!currentRawPuzzle) return null;
    return convertPuzzle(currentRawPuzzle);
  }, [currentRawPuzzle]);

  // ─── Loading State ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div
          className="w-12 h-12 rounded-full border-2 animate-spin"
          style={{
            borderColor: "rgba(212,175,110,0.15)",
            borderTopColor: "#D4AF6E",
          }}
        />
        <p className="text-sm font-mono uppercase tracking-widest" style={{ color: "#8E8B82" }}>
          Loading Puzzles…
        </p>
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center px-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}
        >
          <BookOpen className="w-6 h-6" style={{ color: "#F87171" }} />
        </div>
        <div>
          <h3 className="text-white font-semibold mb-2">No Puzzles Found</h3>
          <p className="text-sm max-w-xs" style={{ color: "#8E8B82" }}>
            {error}
          </p>
        </div>
        <button
          onClick={onExit}
          className="px-6 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer transition-all duration-200"
          style={{
            background: "rgba(212,175,110,0.1)",
            border: "1px solid rgba(212,175,110,0.25)",
            color: "#D4AF6E",
          }}
        >
          Back to Puzzles
        </button>
      </div>
    );
  }

  // ─── Session Complete ────────────────────────────────────────────────────────
  if (sessionComplete) {
    const accuracy = puzzles.length > 0 ? Math.round((sessionSolved / puzzles.length) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-8 text-center px-4">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,110,0.15), rgba(184,147,74,0.1))",
              border: "1px solid rgba(212,175,110,0.3)",
              boxShadow: "0 0 40px rgba(212,175,110,0.15)",
            }}
          >
            <PartyPopper className="w-9 h-9" style={{ color: "#D4AF6E" }} />
          </div>
        </div>

        <div>
          <h2
            className="text-3xl font-semibold mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "#F5F0E8" }}
          >
            Session Complete!
          </h2>
          <p className="text-sm" style={{ color: "#8E8B82", fontFamily: "Inter, sans-serif" }}>
            You've finished all {puzzles.length} puzzles in this session.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {[
            { label: "Solved", value: sessionSolved, icon: <CheckCircle2 className="w-4 h-4" style={{ color: "#34D399" }} /> },
            { label: "Total", value: puzzles.length, icon: <BookOpen className="w-4 h-4" style={{ color: "#D4AF6E" }} /> },
            { label: "Accuracy", value: `${accuracy}%`, icon: <Trophy className="w-4 h-4" style={{ color: "#FBBF24" }} /> },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-3 text-center"
              style={{
                background: "rgba(8,11,20,0.6)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <span
                className="block text-[9px] font-mono uppercase tracking-wider mb-1.5"
                style={{ color: "#8E8B82" }}
              >
                {stat.label}
              </span>
              <div className="flex items-center justify-center gap-1 font-bold text-sm" style={{ color: "#F5F0E8" }}>
                {stat.icon}
                <span>{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer transition-all duration-200 flex items-center gap-2"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#8E8B82",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#F5F0E8"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#8E8B82"; }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Exit
          </button>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setSessionComplete(false);
              setSessionSolved(0);
              setSessionStreak(0);
            }}
            className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #D4AF6E 0%, #B8934A 100%)",
              color: "#080B14",
              boxShadow: "0 4px 16px rgba(212,175,110,0.2)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(212,175,110,0.35)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(212,175,110,0.2)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // ─── Active Puzzle ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Session Header — progress + stats */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{
          background: "rgba(12, 16, 32, 0.6)",
          border: "1px solid rgba(212,175,110,0.12)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider cursor-pointer transition-all duration-200"
            style={{ color: "#8E8B82" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#F5F0E8"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#8E8B82"; }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Exit
          </button>
          <div
            className="w-px h-5"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
          <div className="flex items-center gap-1.5">
            <Loader2
              className="w-3.5 h-3.5"
              style={{ color: "#D4AF6E" }}
            />
            <span
              className="text-xs font-mono"
              style={{ color: "#D4AF6E" }}
            >
              {currentIndex + 1} / {puzzles.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: "#8E8B82" }}>
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#34D399" }} />
            <span style={{ color: "#F5F0E8" }}>{sessionSolved}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: "#8E8B82" }}>
            <Zap className="w-3.5 h-3.5 fill-current" style={{ color: "#FBBF24" }} />
            <span style={{ color: "#F5F0E8" }}>{sessionStreak}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: "3px", background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${((currentIndex) / puzzles.length) * 100}%`,
            background: "linear-gradient(90deg, #D4AF6E, #B8934A)",
            borderRadius: "999px",
          }}
        />
      </div>

      {/* Puzzle Board */}
      {currentPuzzle && (
        <PuzzleBoard
          puzzle={currentPuzzle}
          puzzleNumber={`${currentIndex + 1}`}
          onSolved={handleSolved}
          onFailed={handleFailed}
          onNextPuzzle={handleNextPuzzle}
        />
      )}

      {/* Theme tags */}
      {currentRawPuzzle.themes.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <Tag className="w-3 h-3 flex-shrink-0" style={{ color: "#5C5954" }} />
          {currentRawPuzzle.themes.slice(0, 5).map((theme) => (
            <span
              key={theme}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(212,175,110,0.06)",
                border: "1px solid rgba(212,175,110,0.15)",
                color: "#8E8B82",
              }}
            >
              {formatThemeLabel(theme)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
