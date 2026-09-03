import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { PathwayComponentProps, PuzzleTileState } from '@/types/puzzles-pathway.types';
import { Lock, Check, Leaf } from 'lucide-react';
import bgImage from '@/assets/Plain_BG.png';
import tileImage from '@/assets/Tile.png';
import { VERDANT_FOREST_NODES } from '@/data/puzzles-verdantForestNodes';

export const VerdantForestPathway: React.FC<PathwayComponentProps> = ({
  playerProgress,
  onSelectPuzzle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateDimensions = () => {
      const rect = el.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const nodeStates = useMemo(() => {
    const states: Record<string, PuzzleTileState> = {};
    const completedSet = new Set(playerProgress.completedPuzzleIds);
    let currentId = playerProgress.currentPuzzleId;
    if (!currentId && VERDANT_FOREST_NODES.length > 0) {
      const firstUncompleted = VERDANT_FOREST_NODES.find(n => !completedSet.has(n.id));
      currentId = firstUncompleted ? firstUncompleted.id : VERDANT_FOREST_NODES[VERDANT_FOREST_NODES.length - 1].id;
    }
    VERDANT_FOREST_NODES.forEach((node, i) => {
      if (completedSet.has(node.id)) {
        states[node.id] = 'completed';
      } else if (node.id === currentId || i === 0 || (i > 0 && completedSet.has(VERDANT_FOREST_NODES[i - 1].id))) {
        states[node.id] = 'current';
      } else {
        states[node.id] = 'locked';
      }
    });
    return states;
  }, [playerProgress]);

  return (
    <div ref={containerRef} className="relative w-full h-[640px] overflow-hidden rounded-2xl border border-emerald-500/40 bg-[#041a0f] select-none">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url(${bgImage})`, filter: 'hue-rotate(90deg) saturate(150%)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#041a0f]/90 via-[#041a0f]/50 to-[#041a0f]/95 pointer-events-none" />
      </div>

      {dimensions.width > 0 && dimensions.height > 0 &&
        VERDANT_FOREST_NODES.map((node, i) => {
          if (i === VERDANT_FOREST_NODES.length - 1) return null;
          const nextNode = VERDANT_FOREST_NODES[i + 1];
          const isUnlocked = nodeStates[node.id] === 'completed' || nodeStates[node.id] === 'current';
          const x1 = (node.x / 100) * dimensions.width;
          const y1 = (node.y / 100) * dimensions.height;
          const x2 = (nextNode.x / 100) * dimensions.width;
          const y2 = (nextNode.y / 100) * dimensions.height;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          return (
            <div
              key={`verdant-beam-${node.id}-${nextNode.id}`}
              className="absolute pointer-events-none z-10"
              style={{
                left: `${midX}px`,
                top: `${midY}px`,
                width: `${distance}px`,
                height: '14px',
                transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
              }}
            >
              <div
                className={`w-full h-full rounded-full transition-all duration-500 ${
                  isUnlocked
                    ? 'bg-gradient-to-r from-emerald-400 via-green-100 to-emerald-500 opacity-95'
                    : 'bg-[#0a3820]/60 border border-emerald-950/40 opacity-40'
                }`}
              />
            </div>
          );
        })}

      {VERDANT_FOREST_NODES.map((node) => {
        const state = nodeStates[node.id] || 'locked';
        const isLocked = state === 'locked';
        const isCurrent = state === 'current';
        const isCompleted = state === 'completed';

        return (
          <div
            key={`verdant-tile-${node.id}`}
            className="absolute z-20 transition-transform duration-300 hover:scale-110 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <button
              type="button"
              onClick={() => !isLocked && onSelectPuzzle(node)}
              disabled={isLocked}
              aria-label={`Level ${node.levelNumber}`}
              className="relative flex items-center justify-center w-20 h-20 sm:w-[5.5rem] sm:h-[5.5rem] select-none bg-transparent border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:grayscale"
            >
              {isCurrent && (
                <div className="absolute inset-0 rounded-full bg-emerald-500/50 blur-md animate-pulse pointer-events-none" />
              )}

              <img
                src={tileImage}
                alt={`Tile ${node.levelNumber}`}
                className={`w-full h-full object-contain transition-all duration-300 ${
                  isCurrent ? 'scale-110 brightness-125' : ''
                }`}
                style={{ filter: 'hue-rotate(90deg)' }}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`font-['Bonheur_Royale'] text-4xl font-bold leading-none text-emerald-200 ${
                  isCurrent ? 'text-emerald-100 font-extrabold scale-110' : ''
                }`}>
                  {node.levelNumber}
                </span>
              </div>

              {isLocked && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-emerald-950/90 border border-emerald-800 text-emerald-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              {isCompleted && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-emerald-600 border border-emerald-300 text-white">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-emerald-400 border border-emerald-100 text-slate-950 animate-bounce">
                  <Leaf className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
export default VerdantForestPathway;
