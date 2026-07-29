import { Trophy, ShieldAlert, RotateCcw } from 'lucide-react';
import { type GameStatus, type GameResult } from '../../types/chess';
import { soundManager } from '../../utils/SoundManager';

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
  if (status === 'idle' || status === 'playing') return null;

  const isPlayerWinner =
    (result === 'white' && playerColor === 'w') ||
    (result === 'black' && playerColor === 'b');

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
    <div className="absolute inset-0 z-20 bg-[#080B14]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      <div className="p-3.5 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent mb-4">
        {isPlayerWinner ? (
          <Trophy className="w-8 h-8 text-amber-400" />
        ) : (
          <ShieldAlert className="w-8 h-8 text-rose-400" />
        )}
      </div>

      <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-1">
        {title}
      </h2>
      <p className="text-xs sm:text-sm text-brand-secondary mb-6">{subtitle}</p>

      <button
        onClick={() => {
          soundManager.playButtonClick();
          onNewGame();
        }}
        className="flex items-center gap-2 py-3 px-6 rounded-xl font-display font-bold text-sm text-black bg-gradient-to-r from-[#D4AF6E] via-[#F3E5AB] to-[#D4AF6E] hover:brightness-110 shadow-[0_0_25px_rgba(212,175,110,0.3)] transition-all duration-300 transform active:scale-95"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Play Again</span>
      </button>
    </div>
  );
}
