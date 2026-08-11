import { useEffect, useRef, useMemo } from 'react';
import type { Chess } from 'chess.js';
import { History, Swords } from 'lucide-react';

interface MoveLogProps {
  moves: ReturnType<Chess['history']>;
}

interface MovePair {
  moveNumber: number;
  white: string;
  black?: string;
}

export function MoveLog({ moves }: MoveLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const movePairs = useMemo(() => {
    const pairs: MovePair[] = [];
    const getSan = (item: string | { san?: string } | undefined) =>
      typeof item === 'string' ? item : item?.san || '';

    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: getSan(moves[i]),
        black: moves[i + 1] ? getSan(moves[i + 1]) : undefined,
      });
    }
    return pairs;
  }, [moves]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);

  const totalMoves = moves.length;

  return (
    <div className="flex flex-col h-full bg-brand-surface/40 border border-white/[0.07] rounded-2xl overflow-hidden backdrop-blur-md">
      {/* Header Bar */}
      <div className="px-4 py-2.5 border-b border-white/[0.05] bg-brand-surface/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-brand-accent" />
          <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-brand-text">
            Move Log
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-accent/15 text-brand-accent">
          {totalMoves} {totalMoves === 1 ? 'ply' : 'plies'}
        </span>
      </div>

      {/* Body Feed */}
      <div
        ref={scrollRef}
        className={`flex-1 p-3 font-mono text-xs space-y-1 min-h-0 ${
          movePairs.length > 0
            ? 'overflow-y-auto scrollbar-thin scrollbar-thumb-brand-accent/20'
            : 'overflow-hidden'
        }`}
      >
        {movePairs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-brand-secondary/60 text-center py-10 space-y-2">
            <Swords className="w-8 h-8 text-brand-secondary/30" />
            <p className="font-sans text-xs italic">No moves played yet.</p>
            <p className="text-[10px] text-brand-secondary/50 font-mono">Make your opening move to begin</p>
          </div>
        ) : (
          movePairs.map((pair, index) => {
            const isLatestPair = index === movePairs.length - 1;
            return (
              <div
                key={pair.moveNumber}
                className={`grid grid-cols-[3.2rem_1fr_1fr] items-center px-3 py-1.5 rounded-xl transition-all duration-150 ${
                  isLatestPair
                    ? 'bg-brand-accent/15 text-brand-accent'
                    : 'hover:bg-brand-surface/60 text-brand-text/90'
                }`}
              >
                <span className="text-brand-secondary/70 font-bold">{pair.moveNumber}.</span>
                <span className={`font-semibold ${isLatestPair && !pair.black ? 'text-brand-accent font-bold' : ''}`}>
                  {pair.white}
                </span>
                <span className={`font-semibold ${isLatestPair && pair.black ? 'text-brand-accent font-bold' : 'text-brand-text/80'}`}>
                  {pair.black || ''}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
