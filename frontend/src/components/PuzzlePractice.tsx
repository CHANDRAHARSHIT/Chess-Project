import { useState, useEffect, useCallback } from 'react';
import { getRandomPuzzle, getRandomPuzzleExcluding } from '../utils/PuzzleLoader';
import type { ChessPuzzle } from '../utils/PuzzleLoader';
import { PuzzleBoard } from './PuzzleBoard';
import { RefreshCw, Play } from 'lucide-react';

export default function PuzzlePractice() {
  const [currentPuzzle, setCurrentPuzzle] = useState<ChessPuzzle | null>(null);

  // Initialize with a random puzzle on mount
  useEffect(() => {
    const puzzle = getRandomPuzzle();
    setCurrentPuzzle(puzzle);
  }, []);

  const handleNextPuzzle = useCallback(() => {
    if (!currentPuzzle) return;
    
    // Select another random puzzle, guaranteeing no immediate repeat
    const nextPuzzle = getRandomPuzzleExcluding(currentPuzzle.id);
    if (nextPuzzle) {
      setCurrentPuzzle(nextPuzzle);
    }
  }, [currentPuzzle]);

  const handleSkip = useCallback(() => {
    handleNextPuzzle();
  }, [handleNextPuzzle]);

  if (!currentPuzzle) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-brand-secondary text-center bg-brand-surface border border-brand-border rounded-xl max-w-md mx-auto my-8">
        <Play className="w-8 h-8 text-brand-accent animate-pulse mb-3" />
        <p className="text-sm">No puzzles loaded.</p>
        <p className="text-xs text-brand-secondary/70 mt-1">
          Please run the extraction script or ensure matein1.json is populated.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 max-w-md mx-auto py-8">
      {/* Title & Metadata Panel */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-brand-text tracking-tight">Mate in 1 Practice</h3>
        <p className="text-sm text-brand-secondary mt-1">
          Difficulty Rating: <span className="text-brand-accent font-semibold">{currentPuzzle.rating}</span>
        </p>
      </div>

      {/* Interactive Chessboard */}
      <PuzzleBoard 
        puzzle={currentPuzzle} 
        onNextPuzzle={handleNextPuzzle} 
      />

      {/* Utility Skip Button */}
      <button
        onClick={handleSkip}
        className="flex items-center gap-2 px-5 py-2.5 border border-brand-border hover:border-brand-accent text-brand-text hover:text-brand-accent hover:bg-brand-surface/40 rounded-lg text-xs font-bold transition-all duration-200 shadow-md active:scale-95"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Skip / Random Puzzle
      </button>
    </div>
  );
}
