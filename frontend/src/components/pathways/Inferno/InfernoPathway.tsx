import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { PathwayComponentProps, PathNode, PuzzleTileState } from '../../../types/PuzzlePath';
import { Lock, Check, Flame } from 'lucide-react';
import bgImage from '../../../assets/Background-w-assets.png';
import tileImage from '../../../assets/Tile.png';
import './InfernoPathway.css';

export const INFERNO_NODES: PathNode[] = [
  { id: 'inf_001', levelNumber: 1, x: 22, y: 90, fen: 'rnbqkn1r/ppppp2p/5p2/6p1/4P3/3P4/PPP2PPP/RNBQKBNR w KQkq - 0 3', solution: 'Qh5#', rating: 500, title: 'Hellfire Gate' },
  { id: 'inf_002', levelNumber: 2, x: 48, y: 83, fen: 'rnbqk1nr/ppp2ppp/3p4/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4', solution: 'Qxf7#', rating: 580, title: 'Magma Falls' },
  { id: 'inf_003', levelNumber: 3, x: 78, y: 76, fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4', solution: 'Qxf7#', rating: 620, title: 'Ember Pass' },
  { id: 'inf_004', levelNumber: 4, x: 62, y: 69, fen: 'r1bqk2r/ppp2ppp/2np4/2b1p3/2B1P1n1/2NP1Q2/PPP2PPP/R1B1K1NR w KQkq - 2 6', solution: 'Qxf7#', rating: 650, title: 'Volcanic Pit' },
  { id: 'inf_005', levelNumber: 5, x: 28, y: 62, fen: '7k/5Qpp/8/8/8/8/8/6K1 w - - 0 1', solution: 'Qf8#', rating: 690, title: 'Fiery Citadel' },
  { id: 'inf_006', levelNumber: 6, x: 38, y: 55, fen: '6k1/5ppp/8/8/8/2Q5/5PPP/6K1 w - - 0 1', solution: 'Qc8#', rating: 730, title: 'Brimstone Ridge' },
  { id: 'inf_007', levelNumber: 7, x: 70, y: 48, fen: '6k1/5ppp/8/8/8/8/1R3PPP/6K1 w - - 0 1', solution: 'Rb8#', rating: 770, title: 'Lava Bridge' },
  { id: 'inf_008', levelNumber: 8, x: 80, y: 41, fen: '3r2k1/5ppp/8/8/8/8/1Q3PPP/3R2K1 w - - 0 1', solution: 'Rxd8#', rating: 810, title: 'Infernal Abyss' },
  { id: 'inf_009', levelNumber: 9, x: 50, y: 34, fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', solution: 'Rd8#', rating: 850, title: 'Scorch Summit' },
  { id: 'inf_010', levelNumber: 10, x: 22, y: 27, fen: '8/8/8/8/8/6k1/6rp/7K b - - 0 1', solution: 'Rg1#', rating: 950, title: 'Blaze Throne' },
  { id: 'inf_011', levelNumber: 11, x: 45, y: 20, fen: 'r1b2r1k/ppp2p1p/2n5/4p3/2B5/6R1/PPP2PPP/3R2K1 w - - 0 1', solution: 'Bxf7#', rating: 1000, title: 'Infernal Apex' },
  { id: 'inf_012', levelNumber: 12, x: 75, y: 12, fen: 'r2qk2r/ppp2ppp/2n5/3np3/2B5/3P1Q2/PPP2PPP/R1B1K2R w KQkq - 0 1', solution: 'Qxf7#', rating: 1050, title: 'Pyre Peak' },
];

export const InfernoPathway: React.FC<PathwayComponentProps> = ({
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
    if (!currentId && INFERNO_NODES.length > 0) {
      const firstUncompleted = INFERNO_NODES.find(n => !completedSet.has(n.id));
      currentId = firstUncompleted ? firstUncompleted.id : INFERNO_NODES[INFERNO_NODES.length - 1].id;
    }
    INFERNO_NODES.forEach((node, i) => {
      if (completedSet.has(node.id)) {
        states[node.id] = 'completed';
      } else if (node.id === currentId || i === 0 || (i > 0 && completedSet.has(INFERNO_NODES[i - 1].id))) {
        states[node.id] = 'current';
      } else {
        states[node.id] = 'locked';
      }
    });
    return states;
  }, [playerProgress]);

  return (
    <div ref={containerRef} className="inferno-container">
      {/* Background Image */}
      <div className="inferno-bg" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="inferno-vignette" />
      </div>

      {/* Embers */}
      {dimensions.width > 0 && dimensions.height > 0 &&
        INFERNO_NODES.map((node, i) => {
          if (i === INFERNO_NODES.length - 1) return null;
          const nextNode = INFERNO_NODES[i + 1];
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
              key={`inf-ember-${node.id}-${nextNode.id}`}
              className="inferno-ember-wrap"
              style={{
                left: `${midX}px`,
                top: `${midY}px`,
                width: `${distance}px`,
                height: '14px',
                transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
              }}
            >
              <div className={`inferno-ember ${isUnlocked ? 'inferno-ember-unlocked' : 'inferno-ember-locked'}`} />
            </div>
          );
        })}

      {/* Tiles */}
      {INFERNO_NODES.map((node) => {
        const state = nodeStates[node.id] || 'locked';
        const isLocked = state === 'locked';
        const isCurrent = state === 'current';
        const isCompleted = state === 'completed';

        return (
          <div
            key={`inf-tile-${node.id}`}
            className="inferno-tile-wrap"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <button
              type="button"
              onClick={() => !isLocked && onSelectPuzzle(node)}
              disabled={isLocked}
              aria-label={`Level ${node.levelNumber}`}
              className="inferno-tile-button"
            >
              {isCurrent && <div className="inferno-active-aura" />}

              <img
                src={tileImage}
                alt={`Tile ${node.levelNumber}`}
                className={`inferno-tile-img ${isCurrent ? 'inferno-current-img' : ''}`}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`inferno-number ${isCurrent ? 'inferno-number-current' : ''}`}>
                  {node.levelNumber}
                </span>
              </div>

              {isLocked && (
                <div className="inferno-badge inferno-badge-locked">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              {isCompleted && (
                <div className="inferno-badge inferno-badge-completed">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {isCurrent && (
                <div className="inferno-badge inferno-badge-current">
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
