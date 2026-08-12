import { useState, useCallback, useEffect, useMemo } from "react";
import { Chess } from "chess.js";
import { PuzzleBoard } from "./PuzzleBoard";
import { PuzzleApiService } from "@/features/puzzles/puzzle.service";
import type { CuratedPuzzle } from "@/features/puzzles/puzzle.types";
import type { PuzzleFilters } from "@/features/puzzles/puzzle.types";
import type { ChessPuzzle } from "@/features/puzzles/puzzleLoader";
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

  // Fetch puzzles when filters change
  useEffect(() => {
    let cancelled = false;

    async function fetchPuzzles() {
      setLoading(true);
      setError(null);
      try {
        const data = await PuzzleApiService.getPuzzles(filters);
        if (cancelled) return;
        if (data.length === 0) {
          setError("No puzzles found for the selected filters. Try adjusting your rating range or themes.");
        } else {
          setPuzzles(data);
        }
      } catch {
        if (!cancelled) setError("Failed to load puzzles. Please check your connection.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPuzzles();
    return () => { cancelled = true; };
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
  // Mirrors the full active-puzzle layout (header, progress bar, PuzzleBoard's own
  // heading/board/status/controls structure) so the container height matches the
  // loaded state exactly and nothing shifts once puzzles arrive.
  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        {/* Session Header skeleton */}
        <div className="rounded-2xl p-4 flex items-center justify-between bg-brand-surface/80 border border-brand-border/60 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-brand-secondary/40">
              <ArrowLeft className="w-3.5 h-3.5" />
              Exit
            </div>
            <div className="w-px h-5 bg-brand-border/40" />
            <div className="h-3.5 w-14 rounded bg-brand-border/30 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3.5 w-8 rounded bg-brand-border/30 animate-pulse" />
            <div className="h-3.5 w-8 rounded bg-brand-border/30 animate-pulse" />
          </div>
        </div>

        {/* Progress bar skeleton */}
        <div className="w-full rounded-full overflow-hidden h-[3px] bg-brand-border/30" />

        {/* Board stage skeleton — same structure as PuzzleBoard */}
        <div className="flex flex-col items-center gap-3 sm:gap-3.5 w-full">
          <div className="h-4 w-24 rounded bg-brand-border/30 animate-pulse" />
          <div className="relative w-full max-w-[500px] sm:max-w-[540px] aspect-square rounded-sm border border-brand-border/60 bg-brand-surface overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 animate-spin border-brand-accent/20 border-t-brand-accent" />
              <p className="text-sm font-mono uppercase tracking-widest text-brand-secondary">
                Loading Puzzles…
              </p>
            </div>
          </div>
          <div className="h-8" />
          <div className="w-full max-w-[500px] sm:max-w-none flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-4 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 min-w-[70px] sm:flex-initial sm:w-[90px] h-[44px] rounded-xl bg-brand-surface border border-brand-border/60 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 text-center px-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center bg-rose-500/10 border border-rose-500/20"
        >
          <BookOpen className="w-6 h-6 text-rose-400" />
        </div>
        <div>
          <h3 className="text-brand-text font-semibold mb-2">No Puzzles Found</h3>
          <p className="text-sm max-w-xs text-brand-secondary">
            {error}
          </p>
        </div>
        <button
          onClick={onExit}
          className="btn-gold-outline px-6 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer transition-all duration-200 bg-brand-accent/10 border border-brand-accent/30 text-brand-accent hover:bg-brand-accent/20"
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
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-8 text-center px-4">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center bg-brand-accent/10 border border-brand-accent/30"
          >
            <PartyPopper className="w-9 h-9 text-brand-accent" />
          </div>
        </div>

        <div>
          <h2
            className="text-3xl font-semibold mb-2 font-serif text-brand-text"
          >
            Session Complete!
          </h2>
          <p className="text-sm text-brand-secondary font-sans">
            You've finished all {puzzles.length} puzzles in this session.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {[
            { label: "Solved", value: sessionSolved, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
            { label: "Total", value: puzzles.length, icon: <BookOpen className="w-4 h-4 text-brand-accent" /> },
            { label: "Accuracy", value: `${accuracy}%`, icon: <Trophy className="w-4 h-4 text-amber-400" /> },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-3 text-center bg-brand-surface border border-brand-border/60"
            >
              <span
                className="block text-[9px] font-mono uppercase tracking-wider mb-1.5 text-brand-secondary"
              >
                {stat.label}
              </span>
              <div className="flex items-center justify-center gap-1 font-bold text-sm text-brand-text">
                {stat.icon}
                <span>{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer transition-all duration-200 flex items-center gap-2 bg-brand-text/5 border border-brand-border/40 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40"
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
            className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-all duration-200 btn-premium-cta cta-shine"
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
        className="rounded-2xl p-4 flex items-center justify-between bg-brand-surface/80 border border-brand-border/60 backdrop-blur-md"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider cursor-pointer transition-all duration-200 text-brand-secondary hover:text-brand-text"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Exit
          </button>
          <div
            className="w-px h-5 bg-brand-border/40"
          />
          <div className="flex items-center gap-1.5">
            <Loader2
              className="w-3.5 h-3.5 text-brand-accent"
            />
            <span
              className="text-xs font-mono text-brand-accent font-semibold"
            >
              {currentIndex + 1} / {puzzles.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-brand-secondary">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-brand-text font-semibold">{sessionSolved}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-brand-secondary">
            <Zap className="w-3.5 h-3.5 fill-current text-amber-400" />
            <span className="text-brand-text font-semibold">{sessionStreak}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="w-full rounded-full overflow-hidden h-[3px] bg-brand-border/30"
      >
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{
            width: `${((currentIndex) / puzzles.length) * 100}%`,
            background: "linear-gradient(90deg, var(--gold-bright), var(--gold-mid))",
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
      {currentRawPuzzle?.themes && currentRawPuzzle.themes.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <Tag className="w-3 h-3 flex-shrink-0 text-brand-secondary/70" />
          {currentRawPuzzle.themes.slice(0, 5).map((theme) => (
            <span
              key={theme}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-secondary"
            >
              {formatThemeLabel(theme)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

