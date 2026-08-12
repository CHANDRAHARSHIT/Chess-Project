import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Bot, HelpCircle, X, Shuffle, ShieldCheck } from 'lucide-react';
import { useChess960Game } from '@/hooks/useChess960Game';
import { GameBoard } from '@/features/play/components/GameBoard';
import { GameControls } from '@/features/play/components/GameControls';
import { MoveLog } from '@/features/play/components/MoveLog';
import { GameStatusBanner } from '@/features/play/components/GameStatusBanner';
import { Chess960SetupPanel } from '@/features/play/components/Chess960SetupPanel';
import { DIFFICULTY_CONFIGS } from '@/types/chess';
import { soundManager } from '@/utils/SoundManager';

export default function Chess960Page() {
  const navigate = useNavigate();
  const game = useChess960Game();
  const [isSetupOpen, setIsSetupOpen] = useState(true);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

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
      // Deterministic fallback: direct-URL access has no history to pop,
      // so navigate explicitly to the hub's Variants tab.
      navigate('/play?tab=variants', { replace: true });
    }
  };

  return (
    
    <div className="
      flex flex-col gap-3 px-3 py-3 select-none
      lg:h-[calc(100vh-4rem)] lg:px-5 lg:py-4 lg:overflow-hidden
    ">

      {/* ── Header — adapts between mobile compact and desktop full ── */}
      <div className="w-full shrink-0 flex items-center justify-between gap-2 px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl lg:rounded-2xl bg-brand-surface border border-brand-text/15 backdrop-blur-xl">
        <div className="flex items-center gap-2 lg:gap-3">
          <button
            onClick={handleBackToVariants}
            className="inline-flex items-center gap-1 lg:gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg lg:rounded-xl bg-brand-text/5 hover:bg-brand-text/10 text-brand-secondary hover:text-brand-text border border-brand-text/15 transition-all duration-200 font-mono text-xs font-semibold cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 lg:transition-transform lg:group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Variants</span>
            <span className="sm:hidden">Back</span>
          </button>
          <div className="flex items-center gap-2 lg:gap-2.5">
            <div className="hidden lg:flex p-1.5 rounded-xl bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
              <Shuffle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 lg:gap-2">
                <h1 className="font-display font-bold text-base lg:text-xl text-brand-text tracking-tight">Chess 960</h1>
                <span className="px-1.5 lg:px-2 py-0.5 rounded-full text-[9px] lg:text-[10px] font-mono font-bold bg-brand-accent/15 text-brand-accent border border-brand-accent/30">
                  <span className="lg:hidden">960</span>
                  <span className="hidden lg:inline">Fischer Random</span>
                </span>
              </div>
              <p className="hidden lg:block text-[11px] text-brand-secondary font-mono">
                Randomized back-rank setups • Play vs Stockfish Engine
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 lg:gap-2">
          <div className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg lg:rounded-xl bg-brand-text/5 border border-brand-text/15 text-[11px] lg:text-xs font-mono">
            <Bot className="w-3 lg:w-3.5 h-3 lg:h-3.5 text-brand-accent" />
            <span className="text-brand-text font-semibold">{diffConfig.name}</span>
            <span className="hidden lg:inline text-brand-secondary text-[10px]">({diffConfig.rating} Elo)</span>
          </div>
          <button
            onClick={() => { soundManager.playButtonClick(); setIsRulesOpen(true); }}
            className="flex items-center gap-1 lg:gap-1.5 p-2 lg:px-3 lg:py-1.5 rounded-lg lg:rounded-xl bg-brand-text/5 hover:bg-brand-text/10 border border-brand-text/15 text-brand-secondary hover:text-brand-text transition-all duration-200 font-mono text-xs font-medium cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-brand-accent" />
            <span className="hidden lg:inline">Rules</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-1 lg:min-h-0 lg:flex-row lg:items-start lg:gap-4">

  
        <div className="w-full aspect-square lg:w-auto lg:h-full lg:aspect-square lg:shrink-0 flex flex-col">
          {/* Board fills the column; GameStatusBanner stacks below on both breakpoints */}
          <div className="flex-1 min-h-0">
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
          </div>
          <GameStatusBanner
            status={game.status}
            result={game.result}
            playerColor={game.playerColor}
            onNewGame={() => setIsSetupOpen(true)}
          />
        </div>

        {/* Sidebar:
            Mobile  → natural height, full width
            Desktop → flex-1 min-w-0 h-full (takes remaining ~40% width) */}
        <div className="flex flex-col gap-2.5 lg:flex-1 lg:min-w-0 lg:h-full lg:overflow-hidden">

          {/* Turn indicator */}
          {game.status === 'playing' && (
            <div className="flex items-center justify-between px-3.5 py-2.5 lg:py-2 rounded-xl bg-brand-surface border border-brand-text/15 text-xs font-mono shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full transition-all ${
                  game.turn === 'w' ? 'bg-white border border-neutral-300' : 'bg-neutral-800 border border-neutral-600'
                }`} />
                <span className="font-semibold text-brand-text">
                  {game.turn === 'w' ? 'White to Move' : 'Black to Move'}
                </span>
                <span className="text-[10px] text-brand-secondary">
                  ({game.turn === game.playerColor ? 'Your Turn' : 'Engine'})
                </span>
              </div>
              {game.isEngineThinking && (
                <div className="flex items-center gap-1 text-brand-accent font-semibold animate-pulse text-[11px]">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
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

          {/* Move Log:
              Mobile  → fixed h-48, scrollable inside
              Desktop → flex-1 min-h-0, fills remaining sidebar height */}
          <div className="h-48 lg:h-auto lg:flex-1 lg:min-h-0 overflow-hidden rounded-2xl">
            <MoveLog moves={game.moveHistory} />
          </div>
        </div>
      </div>

      {/* ── Modals (shared, always mounted at root so z-index works) ── */}
      <Chess960SetupPanel
        isOpen={isSetupOpen}
        onStart={handleStartGame}
        onClose={() => setIsSetupOpen(false)}
      />

      {isRulesOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setIsRulesOpen(false)}
        >
          <div
            className="relative bg-brand-surface border border-brand-text/15 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 text-brand-text backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-brand-text/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-accent/15 text-brand-accent">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-brand-text">Fischer Random Rules</h3>
                  <p className="text-xs text-brand-secondary">Standard FIDE Chess 960 Specifications</p>
                </div>
              </div>
              <button onClick={() => setIsRulesOpen(false)} className="p-2 rounded-xl text-brand-secondary hover:text-brand-text hover:bg-brand-text/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs font-sans text-brand-secondary leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3.5 rounded-2xl bg-brand-text/5 border border-brand-text/10 space-y-1">
                <p className="font-mono font-bold text-brand-accent uppercase text-[11px]">1. Randomized Back-Rank Setup</p>
                <p>Pieces on the 1st rank (White) and 8th rank (Black) are placed symmetrically in one of 960 valid starting configurations before play begins.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-brand-text/5 border border-brand-text/10 space-y-1">
                <p className="font-mono font-bold text-brand-accent uppercase text-[11px]">2. Bishops on Opposite Colors</p>
                <p>Each side always starts with one light-squared bishop and one dark-squared bishop to maintain board balance.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-brand-text/5 border border-brand-text/10 space-y-1">
                <p className="font-mono font-bold text-brand-accent uppercase text-[11px]">3. King Between Rooks</p>
                <p>The King is always placed somewhere between the two Rooks, enabling both Kingside and Queenside castling in every starting setup.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-brand-text/5 border border-brand-text/10 space-y-1">
                <p className="font-mono font-bold text-brand-accent uppercase text-[11px]">4. Castling Landing Squares</p>
                <p>After castling, the King and Rook land on the exact same squares as standard chess (King on g1/c1 for White, g8/c8 for Black).</p>
              </div>
            </div>
            <div className="pt-2">
              <button onClick={() => setIsRulesOpen(false)} className="w-full py-3 rounded-xl font-mono text-xs uppercase font-bold bg-brand-accent text-black hover:bg-amber-300 transition-colors">
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


