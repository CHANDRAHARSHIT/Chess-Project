import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { PathwayComponentProps, PuzzleTileState } from '@/features/puzzles/pathway.types';
import { Lock, Check, Leaf } from 'lucide-react';
import bgImage from '@/assets/Background-w-assets.png';
import tileImage from '@/assets/Tile.png';
import './VerdantForestPathway.css';
import { VERDANT_FOREST_NODES } from './verdantForestNodes';

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
    <div ref={containerRef} className="verdant-forest-container">
      {/* Background Image */}
      <div className="verdant-forest-bg" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="verdant-forest-vignette" />
      </div>

      {/* Vines */}
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
              key={`vf-vine-${node.id}-${nextNode.id}`}
              className="verdant-forest-vine-wrap"
              style={{
                left: `${midX}px`,
                top: `${midY}px`,
                width: `${distance}px`,
                height: '16px',
                transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
              }}
            >
              <div className={`verdant-forest-vine ${isUnlocked ? 'verdant-forest-vine-unlocked' : 'verdant-forest-vine-locked'}`} />
            </div>
          );
        })}

      {/* Tiles */}
      {VERDANT_FOREST_NODES.map((node) => {
        const state = nodeStates[node.id] || 'locked';
        const isLocked = state === 'locked';
        const isCurrent = state === 'current';
        const isCompleted = state === 'completed';

        return (
          <div
            key={`vf-tile-${node.id}`}
            className="verdant-forest-tile-wrap"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <button
              type="button"
              onClick={() => !isLocked && onSelectPuzzle(node)}
              disabled={isLocked}
              aria-label={`Level ${node.levelNumber}`}
              className="verdant-forest-tile-button"
            >
              {isCurrent && <div className="verdant-forest-active-aura" />}

              <img
                src={tileImage}
                alt={`Tile ${node.levelNumber}`}
                className={`verdant-forest-tile-img ${isCurrent ? 'verdant-forest-current-img' : ''}`}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`verdant-forest-number ${isCurrent ? 'verdant-forest-number-current' : ''}`}>
                  {node.levelNumber}
                </span>
              </div>

              {isLocked && (
                <div className="verdant-forest-badge verdant-forest-badge-locked">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              {isCompleted && (
                <div className="verdant-forest-badge verdant-forest-badge-completed">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {isCurrent && (
                <div className="verdant-forest-badge verdant-forest-badge-current">
                  <Leaf className="w-3.5 h-3.5 fill-current text-emerald-950" />
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
