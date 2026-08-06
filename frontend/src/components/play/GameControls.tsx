import { useState } from 'react';
import { RotateCcw, Flag, FlipHorizontal, Lightbulb } from 'lucide-react';
import { type GameStatus } from '../../types/chess';
import { soundManager } from '../../utils/SoundManager';

interface GameControlsProps {
  status: GameStatus;
  isEngineThinking: boolean;
  onNewGame: () => void;
  onResign: () => void;
  onFlipBoard: () => void;
  onHint: () => void;
}

export function GameControls({
  status,
  isEngineThinking,
  onNewGame,
  onResign,
  onFlipBoard,
  onHint,
}: GameControlsProps) {
  const isPlaying = status === 'playing';
  const [isHintActive, setIsHintActive] = useState(false);

  const btnBaseClass =
    'flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-mono text-[11px] sm:text-xs uppercase tracking-wider font-bold transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none';

  const defaultBtnClass = `${btnBaseClass} bg-brand-surface/80 border border-white/[0.08] text-brand-secondary hover:text-brand-text hover:bg-brand-surface hover:-translate-y-0.5`;

  const hintBtnClass = isHintActive
    ? `${btnBaseClass} bg-amber-500/20 border border-amber-500/40 text-amber-500 dark:text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse`
    : `${btnBaseClass} bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 hover:-translate-y-0.5`;

  const resignBtnClass = `${btnBaseClass} bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 hover:-translate-y-0.5`;

  const handleHintClick = () => {
    soundManager.playButtonClick();
    setIsHintActive(true);
    onHint();
    setTimeout(() => setIsHintActive(false), 3500);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 sm:p-2.5 bg-brand-surface/60 border border-white/[0.07] rounded-2xl backdrop-blur-md shrink-0 shadow-sm">

      <button
        onClick={() => {
          soundManager.playButtonClick();
          onNewGame();
        }}
        className={defaultBtnClass}
        title="New Game Setup"
      >
        <RotateCcw className="w-3.5 h-3.5 text-brand-accent" />
        <span>New Game</span>
      </button>

      <button
        onClick={() => {
          soundManager.playButtonClick();
          onFlipBoard();
        }}
        disabled={!isPlaying}
        className={defaultBtnClass}
        title="Flip Board View"
      >
        <FlipHorizontal className="w-3.5 h-3.5 text-brand-secondary" />
        <span>Flip</span>
      </button>

      <button
        onClick={handleHintClick}
        disabled={!isPlaying || isEngineThinking}
        className={hintBtnClass}
        title="Request Hint"
      >
        <Lightbulb className={`w-3.5 h-3.5 ${isHintActive ? 'animate-bounce text-amber-300' : 'text-amber-400'}`} />
        <span>{isHintActive ? 'Hinting...' : 'Hint'}</span>
      </button>

      <button
        onClick={() => {
          soundManager.playButtonClick();
          onResign();
        }}
        disabled={!isPlaying}
        className={resignBtnClass}
        title="Resign Current Game"
      >
        <Flag className="w-3.5 h-3.5 text-rose-400" />
        <span>Resign</span>
      </button>
    </div>
  );
}
