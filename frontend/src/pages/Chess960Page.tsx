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
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-brand-border/40">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToVariants}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-brand-secondary hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Variants</span>
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl text-white tracking-tight">
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
            <span className="text-white font-medium">{diffConfig.name}</span>
            <span className="text-brand-secondary/80">({diffConfig.rating})</span>
          </div>
        </div>
      </div>

      {/* Main Game Section */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 flex-1">
        {/* Board Container */}
        <div className="relative flex flex-col items-center justify-center w-full max-w-[540px]">
          <GameBoard
            fen={game.fen}
            boardOrientation={game.boardOrientation}
            onPieceDrop={game.onPieceDrop}
            lastMove={game.lastMove}
            hintSquare={game.hintSquare}
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
        <div className="w-full max-w-[540px] lg:max-w-xs xl:max-w-sm flex flex-col gap-4 self-stretch min-h-[360px]">
          <GameControls
            status={game.status}
            isEngineThinking={game.isEngineThinking}
            onNewGame={() => setIsSetupOpen(true)}
            onResign={game.resign}
            onFlipBoard={game.flipBoard}
            onHint={game.requestHint}
          />

          <div className="flex-1 min-h-[220px]">
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
