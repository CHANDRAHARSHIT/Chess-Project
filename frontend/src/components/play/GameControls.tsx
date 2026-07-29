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

  const btnClass =
    'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold bg-brand-surface/60 border border-brand-border/60 hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-brand-border/60 disabled:hover:text-brand-secondary';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-brand-surface/40 border border-brand-border/60 rounded-xl backdrop-blur-md">
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
        className={btnClass}
        title="Flip Board View"
      >
        <FlipHorizontal className="w-4 h-4" />
        <span>Flip</span>
      </button>

      <button
        onClick={() => {
          soundManager.playButtonClick();
          onHint();
        }}
        disabled={!isPlaying || isEngineThinking}
        className={btnClass}
        title="Request Hint"
      >
        <Lightbulb className="w-4 h-4 text-amber-400" />
        <span>Hint</span>
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
