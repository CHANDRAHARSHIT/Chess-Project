import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { PathwayComponentProps, PuzzleTileState } from '../../../types/PuzzlePath';
import { Lock, Check, Target } from 'lucide-react';
import bgImage from '../../../assets/Background-w-assets.png';
import tileImage from '../../../assets/Tile.png';
import bridgeImage from '../../../assets/Bridge.png';
import './RoyalGoldPathway.css';

import { ROYAL_GOLD_NODES } from './royalGoldNodes';


export const RoyalGoldPathway: React.FC<PathwayComponentProps> = ({
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
    if (!currentId && ROYAL_GOLD_NODES.length > 0) {
      const firstUncompleted = ROYAL_GOLD_NODES.find(n => !completedSet.has(n.id));
      currentId = firstUncompleted ? firstUncompleted.id : ROYAL_GOLD_NODES[ROYAL_GOLD_NODES.length - 1].id;
    }
    ROYAL_GOLD_NODES.forEach((node, i) => {
      if (completedSet.has(node.id)) {
        states[node.id] = 'completed';
      } else if (node.id === currentId || i === 0 || (i > 0 && completedSet.has(ROYAL_GOLD_NODES[i - 1].id))) {
        states[node.id] = 'current';
      } else {
        states[node.id] = 'locked';
      }
    });
    return states;
  }, [playerProgress]);

  return (
    <div ref={containerRef} className="royal-gold-container">
      {/* Background Image */}
      <div className="royal-gold-bg" style={{ backgroundImage: `url(${bgImage})`, opacity:1 }}>
        <div className="royal-gold-vignette" />
      </div>

      {/* Bridges */}
      {dimensions.width > 0 && dimensions.height > 0 &&
        ROYAL_GOLD_NODES.map((node, i) => {
          if (i === ROYAL_GOLD_NODES.length - 1) return null;
          const nextNode = ROYAL_GOLD_NODES[i + 1];
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

          const bridgeHeight = dimensions.width > 0 && dimensions.width < 500
            ? `${Math.max(24, Math.round((dimensions.width / 440) * 42))}px`
            : '42px';

          return (
            <div
              key={`rg-bridge-${node.id}-${nextNode.id}`}
              className="royal-gold-bridge-wrap"
              style={{
                left: `${midX}px`,
                top: `${midY}px`,
                width: `${distance}px`,
                height: bridgeHeight,
                transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
              }}
            >
              <img
                src={bridgeImage}
                alt="Golden Bridge"
                className={`royal-gold-bridge-img ${isUnlocked ? 'royal-gold-bridge-unlocked' : 'royal-gold-bridge-locked'}`}
              />
            </div>
          );
        })}

      {/* Tiles */}
      {ROYAL_GOLD_NODES.map((node) => {
        const state = nodeStates[node.id] || 'locked';
        const isLocked = state === 'locked';
        const isCurrent = state === 'current';
        const isCompleted = state === 'completed';

        return (
          <div
            key={`rg-tile-${node.id}`}
            className="royal-gold-tile-wrap"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <button
              type="button"
              onClick={() => !isLocked && onSelectPuzzle(node)}
              disabled={isLocked}
              aria-label={`Level ${node.levelNumber}`}
              className="royal-gold-tile-button"
            >
              {isCurrent && <div className="royal-gold-active-aura" />}

              <img
                src={tileImage}
                alt={`Tile ${node.levelNumber}`}
                className={`royal-gold-tile-img ${isCurrent ? 'royal-gold-current-img' : ''}`}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`royal-gold-number ${isCurrent ? 'royal-gold-number-current' : ''}`}>
                  {node.levelNumber}
                </span>
              </div>

              {isLocked && (
                <div className="royal-gold-badge royal-gold-badge-locked">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              {isCompleted && (
                <div className="royal-gold-badge royal-gold-badge-completed">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {isCurrent && (
                <div className="royal-gold-badge royal-gold-badge-current">
                  <Target className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
