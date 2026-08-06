import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, ShieldAlert, RotateCcw } from 'lucide-react';
import { type GameStatus, type GameResult } from '../../types/chess';
import { soundManager } from '../../utils/SoundManager';
import { useButtonGlow } from '../../hooks/useButtonGlow';

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
          particleCount: 120,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#D4AF6E', '#10B981', '#F59E0B', '#FFFFFF', '#3B82F6'],
        });
      } catch (e) {
        console.error('Confetti trigger error:', e);
      }
    }
  }, [status, isPlayerWinner]);

  if (status === 'idle' || status === 'playing') return null;

  const isDraw = result === 'draw';

  const title =
    status === 'checkmate'
      ? 'Checkmate!'
      : status === 'stalemate'
        ? 'Draw by Stalemate'
        : status === 'draw'
          ? 'Game Drawn'
          : 'You Resigned';

  const subtitle = isDraw
    ? 'Peace on the board'
    : isPlayerWinner
      ? 'Victory! You defeated the engine.'
      : 'Engine won this round.';

  return (
    <div className="absolute inset-0 z-30 bg-brand-bg/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      <div className="p-3.5 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent mb-4">
        {isPlayerWinner ? (
          <Trophy className="w-8 h-8 text-amber-400" />
        ) : (
          <ShieldAlert className="w-8 h-8 text-rose-400" />
        )}
      </div>

      <h2 className="font-display font-bold text-2xl sm:text-3xl text-brand-text mb-1">
        {title}
      </h2>
      <p className="text-xs sm:text-sm text-brand-secondary mb-6">{subtitle}</p>

      <button
        ref={playAgainRef}
        onClick={() => {
          soundManager.playButtonClick();
          onNewGame();
        }}
        className="flex items-center gap-2 py-3 px-6 rounded-xl font-mono text-xs uppercase tracking-widest font-bold btn-premium-cta btn-glow-container btn-glow-accent cta-shine cursor-pointer shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all"
      >
        <RotateCcw className="w-4 h-4 text-brand-accent" />
        <span>Play Again</span>
      </button>
    </div>
  );
}
