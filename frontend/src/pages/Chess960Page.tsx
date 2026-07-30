import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Bot } from 'lucide-react';
import { useChess960Game } from '../hooks/useChess960Game';
import { GameBoard } from '../components/play/GameBoard';
import { GameControls } from '../components/play/GameControls';
import { MoveLog } from '../components/play/MoveLog';
import { GameStatusBanner } from '../components/play/GameStatusBanner';
import { Chess960SetupPanel } from '../components/play/Chess960SetupPanel';
import { DIFFICULTY_CONFIGS } from '../types/chess';
import { soundManager } from '../utils/SoundManager';

export default function Chess960Page() {
  const navigate = useNavigate();
  const game = useChess960Game();
  const [isSetupOpen, setIsSetupOpen] = useState(true);

  const diffConfig = DIFFICULTY_CONFIGS[game.difficulty];

  const handleStartGame = (options: Parameters<typeof game.startNewGame>[0]) => {
    game.startNewGame(options);
    setIsSetupOpen(false);
  };

  const handleBackToVariants = () => {
    soundManager.playButtonClick();
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/variants');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-3 sm:p-4 lg:p-4 max-w-7xl mx-auto flex flex-col gap-4">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-brand-border/40 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToVariants}
            className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-colors duration-200 font-sans text-sm font-semibold cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Variants</span>
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl text-brand-text tracking-tight">
              Chess 960
            </h1>
            <p className="text-xs text-brand-secondary">
              Fischer Random • Play vs Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-surface/80 border border-brand-border/60 text-xs font-mono">
            <Bot className="w-4 h-4 text-brand-accent" />
            <span className="text-brand-text font-medium">{diffConfig.name}</span>
            <span className="text-brand-secondary/80">({diffConfig.rating})</span>
          </div>
        </div>
      </div>

      {/* Main Game Section */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-6 flex-1">
        {/* Board Container */}
        <div className="relative flex flex-col items-center justify-center w-full max-w-[540px] shrink-0">
          <GameBoard
            fen={game.fen}
            boardOrientation={game.boardOrientation}
            onPieceDrop={game.onPieceDrop}
            lastMove={game.lastMove}
            hintSquare={game.hintSquare}
            hintMove={game.hintMove}
            checkSquare={game.checkSquare}
            status={game.status}
            isInteractive={!game.isEngineThinking}
          />
          <GameStatusBanner
            status={game.status}
            result={game.result}
            playerColor={game.playerColor}
            onNewGame={() => setIsSetupOpen(true)}
          />
        </div>

        {/* Sidebar Controls & History */}
        <div className="w-full max-w-[540px] lg:max-w-xs xl:max-w-sm flex flex-col gap-3 lg:h-[540px] lg:max-h-[540px] shrink-0 min-h-0">
          {/* Turn Indicator Header Card */}
          {game.status === 'playing' && (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-brand-surface/40 border border-brand-border/60 backdrop-blur-md text-xs font-mono shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full border border-brand-border/60 ${
                    game.turn === 'w' ? 'bg-white' : 'bg-neutral-800'
                  }`}
                />
                <span className="font-medium text-brand-text">
                  {game.turn === 'w' ? "White to move" : "Black to move"}
                </span>
                <span className="text-brand-secondary/70">
                  ({game.turn === game.playerColor ? "Your turn" : "Engine turn"})
                </span>
              </div>
              {game.difficulty >= 3 && game.isEngineThinking && (
                <span className="text-brand-accent animate-pulse font-medium">
                  (Thinking...)
                </span>
              )}
            </div>
          )}

          <GameControls
            status={game.status}
            isEngineThinking={game.isEngineThinking}
            onNewGame={() => setIsSetupOpen(true)}
            onResign={game.resign}
            onFlipBoard={game.flipBoard}
            onHint={game.requestHint}
          />

          <div className="flex-1 min-h-0 overflow-hidden">
            <MoveLog moves={game.moveHistory} />
          </div>
        </div>
      </div>

      {/* Setup Modal */}
      <Chess960SetupPanel
        isOpen={isSetupOpen}
        onStart={handleStartGame}
        onClose={() => setIsSetupOpen(false)}
      />
    </div>
  );
}
