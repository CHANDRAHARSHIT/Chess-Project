import { useEffect, useRef, useMemo } from 'react';
import type { Chess } from 'chess.js';

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

  return (
    <div className="flex flex-col h-full bg-brand-surface/40 border border-brand-border/60 rounded-xl overflow-hidden backdrop-blur-md">
      <div className="px-4 py-3 border-b border-brand-border/40 bg-white/5">
        <h3 className="font-display font-semibold text-sm text-brand-text tracking-wide uppercase">
          Move Log
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1.5 min-h-[140px] max-h-[300px] lg:max-h-full scrollbar-thin scrollbar-thumb-brand-border/40"
      >
        {movePairs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-brand-secondary/60 italic text-center py-8">
            No moves yet
          </div>
        ) : (
          movePairs.map((pair) => (
            <div
              key={pair.moveNumber}
              className="grid grid-cols-[3rem_1fr_1fr] items-center px-2 py-1 rounded hover:bg-white/5 transition-colors"
            >
              <span className="text-brand-secondary/70">{pair.moveNumber}.</span>
              <span className="text-brand-text font-medium">{pair.white}</span>
              <span className="text-brand-text/90 font-medium">{pair.black || ''}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
