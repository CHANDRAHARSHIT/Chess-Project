import { useEffect, useRef, useMemo } from "react";
import { ListOrdered } from "lucide-react";
import type { Chess } from "chess.js";

interface MoveLogProps {
  moves: ReturnType<Chess["history"]>;
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
      typeof item === "string" ? item : item?.san || "";

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
    <div className="flex flex-col h-full bg-brand-surface/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-lg">
      <div className="px-4 py-3 border-b border-white/10 bg-brand-surface/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-brand-accent" />
          <h3 className="font-display font-bold text-sm text-brand-text tracking-wide uppercase">
            Move Notation
          </h3>
        </div>
        <span className="font-mono text-[10px] text-brand-accent font-semibold px-2 py-0.5 rounded bg-brand-accent/10 border border-brand-accent/20">
          {moves.length} {moves.length === 1 ? "ply" : "plies"}
        </span>
      </div>

      <div
        ref={scrollRef}
        className={`flex-1 p-3 font-mono text-xs space-y-1 min-h-0 ${
          movePairs.length > 0
            ? "overflow-y-auto scrollbar-thin scrollbar-thumb-brand-border/40"
            : "overflow-hidden"
        }`}
      >
        {movePairs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-brand-secondary/50 italic text-center py-10">
            <span className="text-xs">No moves played yet</span>
            <span className="text-[10px] not-italic text-brand-secondary/40 mt-1">
              Notation appears here live
            </span>
          </div>
        ) : (
          movePairs.map((pair, index) => {
            const isLastPair = index === movePairs.length - 1;
            const whiteIsLatest = isLastPair && !pair.black;
            const blackIsLatest = isLastPair && !!pair.black;

            return (
              <div
                key={pair.moveNumber}
                className="grid grid-cols-[3.2rem_1fr_1fr] items-center px-3 py-1.5 rounded-lg odd:bg-brand-bg/20 hover:bg-brand-surface/50 transition-colors"
              >
                <span className="text-brand-secondary/60 font-semibold">{pair.moveNumber}.</span>
                <span
                  className={`font-semibold tracking-wide ${
                    whiteIsLatest
                      ? "text-brand-accent bg-brand-accent/15 px-1.5 py-0.5 rounded border border-brand-accent/30"
                      : "text-brand-text"
                  }`}
                >
                  {pair.white}
                </span>
                <span
                  className={`font-semibold tracking-wide ${
                    blackIsLatest
                      ? "text-brand-accent bg-brand-accent/15 px-1.5 py-0.5 rounded border border-brand-accent/30"
                      : "text-brand-text/80"
                  }`}
                >
                  {pair.black || ""}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
