import { useState, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  // Use a ref so mutations don't cause re-renders on the game object
  const gameRef = useRef(new Chess());
  const [gameFen, setGameFen] = useState(() => gameRef.current.fen());

  function makeAMove(move: any) {
    try {
      const result = gameRef.current.move(move);
      setGameFen(gameRef.current.fen());
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

    // Auto-reply with a simple random legal move
    setTimeout(() => {
      const game = gameRef.current;
      const possibleMoves = game.moves();
      if (!game.isGameOver() && possibleMoves.length > 0) {
        const randomIdx = Math.floor(Math.random() * possibleMoves.length);
        makeAMove(possibleMoves[randomIdx]);
      }
    }, 450);

    return true;
  }

  return (
    <header className="relative pt-24 pb-16 md:pt-36 md:pb-28 overflow-hidden bg-brand-bg">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Text Column */}
          <div className="lg:col-span-6 space-y-6 md:space-y-8 text-left">
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.1] md:leading-[1.05]">
              Build the Chess Platform{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent via-indigo-400 to-violet-400">
                Your Audience Deserves
              </span>
            </h1>

            <p className="font-sans text-base sm:text-lg text-brand-secondary max-w-xl leading-relaxed">
              A creator-owned chess platform where you own the brand, community, and upside.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a
                href="#interactive-demo"
                className="inline-flex items-center justify-center gap-2 font-sans font-semibold text-sm bg-brand-accent hover:bg-brand-accent/95 text-white px-6 py-3.5 rounded-lg transition-all duration-200 shadow-xl shadow-brand-accent/20"
              >
                Play Demo
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#partner-cta"
                className="inline-flex items-center justify-center gap-2 font-sans font-semibold text-sm bg-brand-surface hover:bg-brand-surface/80 border border-brand-border text-brand-secondary hover:text-white px-6 py-3.5 rounded-lg transition-all duration-200"
              >
                Become a Partner
              </a>
            </div>
          </div>

          {/* Chessboard Column — clean, no unnecessary overlays */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-[440px] md:max-w-[480px]">
              <div className="bg-brand-surface border border-brand-border rounded-xl shadow-2xl overflow-hidden">
                {/* Board Area */}
                <div className="p-4 bg-brand-surface">
                  <div className="aspect-square rounded-lg overflow-hidden">
                    <Chessboard
                      options={{
                        position: gameFen,
                        onPieceDrop: ({ sourceSquare, targetSquare }) => {
                          return onDrop(sourceSquare, targetSquare);
                        },
                        darkSquareStyle: { backgroundColor: '#b58863' },
                        lightSquareStyle: { backgroundColor: '#f0d9b5' },
                        boardStyle: {
                          borderRadius: '4px',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                        },
                      }}
                    />
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
