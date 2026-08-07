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

  const btnClass =
    'flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl font-mono text-[11px] sm:text-xs uppercase tracking-wider font-semibold bg-brand-surface/60 border border-brand-border/60 hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-brand-border/60 disabled:hover:text-brand-secondary';

  const hintBtnClass = isHintActive
    ? 'flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl font-mono text-[11px] sm:text-xs uppercase tracking-wider font-semibold bg-amber-500/20 border-amber-500/80 text-amber-300 animate-pulse transition-all duration-300'
    : btnClass;

  const handleHintClick = () => {
    soundManager.playButtonClick();
    setIsHintActive(true);
    onHint();
    setTimeout(() => setIsHintActive(false), 3500);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 sm:p-2.5 bg-brand-surface/40 border border-brand-border/60 rounded-xl backdrop-blur-md shrink-0">
      <button
        onClick={() => {
          soundManager.playButtonClick();
          onNewGame();
        }}
        className={btnClass}
        title="New Game Setup"
      >
        <RotateCcw className="w-4 h-4 text-brand-accent" />
        <span>New Game</span>
      </button>

      <button
        onClick={() => {
          soundManager.playButtonClick();
          onFlipBoard();
        }}
        disabled={!isPlaying}
        className={btnClass}
        title="Flip Board View"
      >
        <FlipHorizontal className="w-4 h-4" />
        <span>Flip</span>
      </button>

      <button
        onClick={handleHintClick}
        disabled={!isPlaying || isEngineThinking}
        className={hintBtnClass}
        title="Request Hint"
      >
        <Lightbulb className={`w-4 h-4 ${isHintActive ? 'text-amber-300 animate-spin' : 'text-amber-400'}`} />
        <span>{isHintActive ? 'Hint Active' : 'Hint'}</span>
      </button>

      <button
        onClick={() => {
          soundManager.playButtonClick();
          onResign();
        }}
        disabled={!isPlaying}
        className={btnClass}
        title="Resign Current Game"
      >
        <Flag className="w-4 h-4 text-rose-400" />
        <span>Resign</span>
      </button>
    </div>
  );
}
