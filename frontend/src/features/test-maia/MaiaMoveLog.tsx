/**
 * MaiaMoveLog.tsx
 *
 * Dedicated live move notation log with automatic scroll-pinning, dedicated visible scrollbar,
 * plies tracking, and high-contrast latest ply indicators.
 */
import { useEffect, useRef, useMemo } from "react";
import { ListOrdered, Swords } from "lucide-react";

interface MovePair {
  moveNumber: number;
  white: string;
  black?: string;
}

interface MaiaMoveLogProps {
  sanHistory: string[];
}

export function MaiaMoveLog({ sanHistory }: MaiaMoveLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const movePairs = useMemo(() => {
    const pairs: MovePair[] = [];
    for (let i = 0; i < sanHistory.length; i += 2) {
      pairs.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: sanHistory[i],
        black: sanHistory[i + 1],
      });
    }
    return pairs;
  }, [sanHistory]);

  // Keep latest move in view on every ply
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sanHistory]);

  const totalPlies = sanHistory.length;

  return (
    <div className="flex flex-col h-full max-h-full min-h-0 bg-brand-surface/70 border border-brand-border rounded-xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="px-3.5 py-2 border-b border-brand-border bg-brand-surface/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <ListOrdered className="w-3.5 h-3.5 text-brand-accent" />
          <h3 className="font-display font-bold text-xs text-brand-text tracking-wide uppercase">
            Move Notation
          </h3>
        </div>
        <span className="font-mono text-[9px] text-brand-accent font-semibold px-2 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/25">
          {totalPlies} {totalPlies === 1 ? "ply" : "plies"}
        </span>
      </div>

      {/* Move list with dedicated internal scrollbar */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 p-2 font-mono text-xs space-y-0.5 overflow-y-auto move-log-scrollbar pr-1"
      >
        {movePairs.length === 0 ? (
          <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-center p-3 text-brand-secondary/60">
            <Swords className="w-5 h-5 text-brand-secondary/40 mb-1.5 stroke-[1.5]" />
            <span className="text-xs font-sans font-medium text-brand-secondary">
              No moves played yet
            </span>
            <span className="text-[10px] text-brand-secondary/50 mt-0.5">
              Make a move on the board to begin
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
                className="grid grid-cols-[2.2rem_1fr_1fr] items-center px-2 py-1 rounded odd:bg-brand-bg/30 hover:bg-brand-surface/60 transition-colors text-xs"
              >
                <span className="text-brand-secondary/60 font-semibold text-[11px]">
                  {pair.moveNumber}.
                </span>
                <span
                  className={`font-semibold tracking-wide justify-self-start ${
                    whiteIsLatest
                      ? "text-brand-accent bg-brand-accent/15 px-1.5 py-0.2 rounded border border-brand-accent/30 font-bold"
                      : "text-brand-text"
                  }`}
                >
                  {pair.white}
                </span>
                <span
                  className={`font-semibold tracking-wide justify-self-start ${
                    blackIsLatest
                      ? "text-brand-accent bg-brand-accent/15 px-1.5 py-0.2 rounded border border-brand-accent/30 font-bold"
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
