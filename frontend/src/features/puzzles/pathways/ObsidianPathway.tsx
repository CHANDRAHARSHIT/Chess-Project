import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { PathwayComponentProps, PuzzleTileState } from '@/features/puzzles/pathway.types';
import { Lock, Check, Flame } from 'lucide-react';
import bgImage from '@/assets/Background-w-assets.png';
import tileImage from '@/assets/Tile.png';
import './ObsidianPathway.css';
import { OBSIDIAN_NODES } from './obsidianNodes';

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
    <div ref={containerRef} className="obsidian-container">
      {/* Background Image */}
      <div className="obsidian-bg" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="obsidian-vignette" />
      </div>

      {/* Magma */}
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
              key={`ob-magma-${node.id}-${nextNode.id}`}
              className="obsidian-magma-wrap"
              style={{
                left: `${midX}px`,
                top: `${midY}px`,
                width: `${distance}px`,
                height: '14px',
                transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
              }}
            >
              <div className={`obsidian-magma ${isUnlocked ? 'obsidian-magma-unlocked' : 'obsidian-magma-locked'}`} />
            </div>
          );
        })}

      {/* Tiles */}
      {OBSIDIAN_NODES.map((node) => {
        const state = nodeStates[node.id] || 'locked';
        const isLocked = state === 'locked';
        const isCurrent = state === 'current';
        const isCompleted = state === 'completed';

        return (
          <div
            key={`ob-tile-${node.id}`}
            className="obsidian-tile-wrap"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <button
              type="button"
              onClick={() => !isLocked && onSelectPuzzle(node)}
              disabled={isLocked}
              aria-label={`Level ${node.levelNumber}`}
              className="obsidian-tile-button"
            >
              {isCurrent && <div className="obsidian-active-aura" />}

              <img
                src={tileImage}
                alt={`Tile ${node.levelNumber}`}
                className={`obsidian-tile-img ${isCurrent ? 'obsidian-current-img' : ''}`}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`obsidian-number ${isCurrent ? 'obsidian-number-current' : ''}`}>
                  {node.levelNumber}
                </span>
              </div>

              {isLocked && (
                <div className="obsidian-badge obsidian-badge-locked">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              {isCompleted && (
                <div className="obsidian-badge obsidian-badge-completed">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {isCurrent && (
                <div className="obsidian-badge obsidian-badge-current">
                  <Flame className="w-3.5 h-3.5 fill-current text-amber-300" />
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
