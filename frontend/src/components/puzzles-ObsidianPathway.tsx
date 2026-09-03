import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { PathwayComponentProps, PuzzleTileState } from '@/types/puzzles-pathway.types';
import { Lock, Check, Shield } from 'lucide-react';
import bgImage from '@/assets/Plain_BG.png';
import tileImage from '@/assets/Tile.png';
import { OBSIDIAN_NODES } from '@/data/puzzles-obsidianNodes';

export const ObsidianPathway: React.FC<PathwayComponentProps> = ({
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
    if (!currentId && OBSIDIAN_NODES.length > 0) {
      const firstUncompleted = OBSIDIAN_NODES.find(n => !completedSet.has(n.id));
      currentId = firstUncompleted ? firstUncompleted.id : OBSIDIAN_NODES[OBSIDIAN_NODES.length - 1].id;
    }
    OBSIDIAN_NODES.forEach((node, i) => {
      if (completedSet.has(node.id)) {
        states[node.id] = 'completed';
      } else if (node.id === currentId || i === 0 || (i > 0 && completedSet.has(OBSIDIAN_NODES[i - 1].id))) {
        states[node.id] = 'current';
      } else {
        states[node.id] = 'locked';
      }
    });
    return states;
  }, [playerProgress]);

  return (
    <div ref={containerRef} className="relative w-full h-[640px] overflow-hidden rounded-2xl border border-slate-700/60 bg-[#080b14] select-none">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url(${bgImage})`, filter: 'grayscale(100%) brightness(50%)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#080b14]/90 via-[#080b14]/50 to-[#080b14]/95 pointer-events-none" />
      </div>

      {dimensions.width > 0 && dimensions.height > 0 &&
        OBSIDIAN_NODES.map((node, i) => {
          if (i === OBSIDIAN_NODES.length - 1) return null;
          const nextNode = OBSIDIAN_NODES[i + 1];
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
              key={`obsidian-beam-${node.id}-${nextNode.id}`}
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
                    ? 'bg-gradient-to-r from-slate-400 via-white to-slate-400 opacity-90'
                    : 'bg-slate-900/60 border border-slate-800 opacity-40'
                }`}
              />
            </div>
          );
        })}

      {OBSIDIAN_NODES.map((node) => {
        const state = nodeStates[node.id] || 'locked';
        const isLocked = state === 'locked';
        const isCurrent = state === 'current';
        const isCompleted = state === 'completed';

        return (
          <div
            key={`obsidian-tile-${node.id}`}
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
                <div className="absolute inset-0 rounded-full bg-slate-400/40 blur-md animate-pulse pointer-events-none" />
              )}

              <img
                src={tileImage}
                alt={`Tile ${node.levelNumber}`}
                className={`w-full h-full object-contain transition-all duration-300 ${
                  isCurrent ? 'scale-110 brightness-125' : ''
                }`}
                style={{ filter: 'grayscale(100%) brightness(75%)' }}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`font-['Bonheur_Royale'] text-4xl font-bold leading-none text-slate-200 ${
                  isCurrent ? 'text-white font-extrabold scale-110' : ''
                }`}>
                  {node.levelNumber}
                </span>
              </div>

              {isLocked && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-slate-950/90 border border-slate-700 text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              {isCompleted && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-slate-600 border border-slate-300 text-white">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-slate-300 border border-white text-slate-950 animate-bounce">
                  <Shield className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
export default ObsidianPathway;
