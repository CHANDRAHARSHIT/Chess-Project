import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, ShieldAlert, RotateCcw, Scale } from 'lucide-react';
import { type GameStatus, type GameResult } from '@/types/chess-chess.types';
import { soundManager } from '@/lib/SoundManager';
import { useButtonGlow } from '@/hooks/ui-useButtonGlow';

interface GameStatusBannerProps {
  status: GameStatus;
  result: GameResult;
  playerColor: 'w' | 'b';
  onNewGame: () => void;
}

export function GameStatusBanner({
  status,
  result,
  playerColor,
  onNewGame,
}: GameStatusBannerProps) {
  const playAgainRef = useButtonGlow<HTMLButtonElement>();

  const isPlayerWinner =
    (result === 'white' && playerColor === 'w') ||
    (result === 'black' && playerColor === 'b');

  useEffect(() => {
    if (status === 'checkmate' && isPlayerWinner) {
      try {
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.55 },
          colors: ['#D4AF6E', '#10B981', '#F59E0B', '#FFFFFF', '#3B82F6'],
        });
      } catch (e) {
        console.error('Confetti trigger error:', e);
      }
    }
  }, [status, isPlayerWinner]);

  if (status === 'idle' || status === 'playing') return null;

  const isDraw = result === 'draw' || status === 'stalemate' || status === 'draw';

  const title =
    status === 'checkmate'
      ? isPlayerWinner
        ? 'Checkmate Victory!'
        : 'Engine Checkmate'
      : status === 'stalemate'
        ? 'Draw by Stalemate'
        : status === 'draw'
          ? 'Game Drawn'
          : 'You Resigned';

  const subtitle = isDraw
    ? 'Equally matched battle. Peace restored on the board.'
    : isPlayerWinner
      ? 'Outstanding tactic! You outmaneuvered Stockfish.'
      : 'Stockfish claimed victory this round.';

  return (
    <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn select-none rounded-xl">
      {/* Glow Aura Background */}
      <div
        className={`absolute w-48 h-48 rounded-full blur-3xl pointer-events-none -z-10 ${
          isPlayerWinner
            ? 'bg-amber-500/25'
            : isDraw
              ? 'bg-sky-500/20'
              : 'bg-rose-500/20'
        }`}
      />

      <div
        className={`p-4 rounded-3xl border mb-4 ${
          isPlayerWinner
            ? 'bg-gradient-to-b from-amber-500/20 to-amber-500/5 border-amber-500/40 text-amber-400'
            : isDraw
              ? 'bg-gradient-to-b from-sky-500/20 to-sky-500/5 border-sky-500/40 text-sky-400'
              : 'bg-gradient-to-b from-rose-500/20 to-rose-500/5 border-rose-500/40 text-rose-400'
        }`}
      >
        {isPlayerWinner ? (
          <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
        ) : isDraw ? (
          <Scale className="w-10 h-10 text-sky-400" />
        ) : (
          <ShieldAlert className="w-10 h-10 text-rose-400" />
        )}
      </div>

      <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-brand-text mb-2 tracking-tight">
        {title}
      </h2>

      <p className="text-xs sm:text-sm text-brand-secondary/90 max-w-sm mb-6 leading-relaxed font-sans">
        {subtitle}
      </p>

      <button
        ref={playAgainRef}
        onClick={() => {
          soundManager.playButtonClick();
          onNewGame();
        }}
        className="flex items-center gap-2.5 py-3.5 px-8 rounded-2xl font-mono text-xs uppercase tracking-widest font-bold btn-premium-cta btn-glow-container btn-glow-accent cta-shine cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <RotateCcw className="w-4 h-4 text-brand-accent" />
        <span>Play Again</span>
      </button>
    </div>
  );
}
