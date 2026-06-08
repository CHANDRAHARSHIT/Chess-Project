import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { ArrowRight, Globe } from 'lucide-react';

export default function Hero() {
  const [game, setGame] = useState(() => new Chess());
  const [gameFen, setGameFen] = useState(game.fen());

  function makeAMove(move: any) {
    try {
      const result = game.move(move);
      setGameFen(game.fen());
      return result;
    } catch (e) {
      return null;
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string | null) {
    if (!targetSquare) return false;

    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (move === null) return false;
    
    // Auto-reply with a simple legal move to keep the hero board interactive
    setTimeout(() => {
      const possibleMoves = game.moves();
      if (!game.isGameOver() && possibleMoves.length > 0) {
        const randomIdx = Math.floor(Math.random() * possibleMoves.length);
        makeAMove(possibleMoves[randomIdx]);
      }
    }, 450);

    return true;
  }

  const resetHeroGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setGameFen(newGame.fen());
  };

  return (
    <header className="relative pt-24 pb-16 md:pt-36 md:pb-28 overflow-hidden bg-brand-bg">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Column */}
          <div className="lg:col-span-6 space-y-6 md:space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/25">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              <span className="font-sans font-medium text-xs text-brand-accent tracking-wide uppercase">
                Creator-Owned White-Label Platform
              </span>
            </div>

            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.1] md:leading-[1.05]">
              Launch Your Own <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent via-indigo-400 to-violet-400">
                Chess Platform
              </span>
            </h1>

            <p className="font-sans text-base sm:text-lg text-brand-secondary max-w-xl leading-relaxed">
              Give your audience a place that belongs to you. <br className="hidden sm:inline" />
              Your brand, your lessons, your community. Turn viewership into a fully-owned educational business.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a
                href="#interactive-demo"
                className="inline-flex items-center justify-center gap-2 font-sans font-semibold text-sm bg-brand-accent hover:bg-brand-accent/95 text-white px-6 py-3.5 rounded-lg transition-all duration-200 shadow-xl shadow-brand-accent/20"
              >
                View Live Demo
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#partner-cta"
                className="inline-flex items-center justify-center gap-2 font-sans font-semibold text-sm bg-brand-surface hover:bg-brand-surface/80 border border-brand-border text-brand-secondary hover:text-white px-6 py-3.5 rounded-lg transition-all duration-200"
              >
                Become a Partner
              </a>
            </div>

            {/* Quick value statements */}
            <div className="pt-6 border-t border-brand-border/60 grid grid-cols-3 gap-4">
              <div>
                <p className="text-white font-bold text-lg">100%</p>
                <p className="text-brand-secondary text-xs">White-labeled domain</p>
              </div>
              <div>
                <p className="text-white font-bold text-lg">Zero</p>
                <p className="text-brand-secondary text-xs">Middleman fees</p>
              </div>
              <div>
                <p className="text-white font-bold text-lg">Instant</p>
                <p className="text-brand-secondary text-xs">Stockfish WASM analysis</p>
              </div>
            </div>
          </div>

          {/* Chessboard Column */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-[440px] md:max-w-[480px]">
              
              {/* Mock white-label frame */}
              <div className="bg-brand-surface border border-brand-border rounded-xl shadow-2xl overflow-hidden">
                {/* Frame Header */}
                <div className="bg-brand-bg/50 border-b border-brand-border px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/20" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/20" />
                    <span className="w-3 h-3 rounded-full bg-green-500/20" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-brand-bg border border-brand-border">
                    <Globe className="w-3 h-3 text-brand-secondary" />
                    <span className="text-xs font-sans text-brand-secondary tracking-wide">
                      chess.grandmasteracademy.com
                    </span>
                  </div>
                  <button 
                    onClick={resetHeroGame}
                    className="text-xs font-medium text-brand-accent hover:underline hover:text-indigo-400"
                  >
                    Reset
                  </button>
                </div>
                
                {/* Board Area */}
                <div className="p-6 bg-brand-surface relative">
                  <div className="aspect-square relative rounded shadow-inner overflow-hidden border border-brand-border bg-[#1A2235]">
                    <Chessboard 
                      options={{
                        position: gameFen,
                        onPieceDrop: ({ sourceSquare, targetSquare }) => {
                          return onDrop(sourceSquare, targetSquare);
                        },
                        darkSquareStyle: { backgroundColor: '#1E293B' },
                        lightSquareStyle: { backgroundColor: '#384252' },
                        boardStyle: {
                          borderRadius: '4px',
                          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
                        }
                      }}
                    />
                  </div>
                  
                  {/* Instructional Tip Overlay */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-xs font-sans text-brand-secondary">
                        Try dragging a piece to test the interface
                      </span>
                    </div>
                    <span className="text-xs font-mono text-brand-secondary/80">
                      FEN: {gameFen.split(' ')[0].slice(0, 15)}...
                    </span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
