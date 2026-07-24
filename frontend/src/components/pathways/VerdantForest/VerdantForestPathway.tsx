import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { PathwayComponentProps, PathNode, PuzzleTileState } from '../../../types/PuzzlePath';
import { Lock, Check, Leaf } from 'lucide-react';
import bgImage from '../../../assets/Background-w-assets.png';
import tileImage from '../../../assets/Tile.png';
import './VerdantForestPathway.css';

export const VERDANT_FOREST_NODES: PathNode[] = [
  { id: 'vf_001', levelNumber: 1, x: 80, y: 92, fen: 'rnbqkn1r/ppppp2p/5p2/6p1/4P3/3P4/PPP2PPP/RNBQKBNR w KQkq - 0 3', solution: 'Qh5#', rating: 500, title: 'Forest Meadow' },
  { id: 'vf_002', levelNumber: 2, x: 62, y: 85, fen: 'rnbqk1nr/ppp2ppp/3p4/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4', solution: 'Qxf7#', rating: 570, title: 'Whispering Glade' },
  { id: 'vf_003', levelNumber: 3, x: 38, y: 78, fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4', solution: 'Qxf7#', rating: 610, title: 'Emerald Canopy' },
  { id: 'vf_004', levelNumber: 4, x: 20, y: 71, fen: 'r1bqk2r/ppp2ppp/2np4/2b1p3/2B1P1n1/2NP1Q2/PPP2PPP/R1B1K1NR w KQkq - 2 6', solution: 'Qxf7#', rating: 630, title: 'Mossy Path' },
  { id: 'vf_005', levelNumber: 5, x: 35, y: 64, fen: '7k/5Qpp/8/8/8/8/8/6K1 w - - 0 1', solution: 'Qf8#', rating: 670, title: 'Ancient Oak' },
  { id: 'vf_006', levelNumber: 6, x: 65, y: 57, fen: '6k1/5ppp/8/8/8/2Q5/5PPP/6K1 w - - 0 1', solution: 'Qc8#', rating: 710, title: 'Hidden Creek' },
  { id: 'vf_007', levelNumber: 7, x: 78, y: 50, fen: '6k1/5ppp/8/8/8/8/1R3PPP/6K1 w - - 0 1', solution: 'Rb8#', rating: 740, title: 'Sylvan Bridge' },
  { id: 'vf_008', levelNumber: 8, x: 55, y: 43, fen: '3r2k1/5ppp/8/8/8/8/1Q3PPP/3R2K1 w - - 0 1', solution: 'Rxd8#', rating: 780, title: 'Verdant Ridge' },
  { id: 'vf_009', levelNumber: 9, x: 28, y: 36, fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', solution: 'Rd8#', rating: 820, title: 'Woodland Pass' },
  { id: 'vf_010', levelNumber: 10, x: 42, y: 29, fen: '8/8/8/8/8/6k1/6rp/7K b - - 0 1', solution: 'Rg1#', rating: 920, title: 'Forest Shrine' },
  { id: 'vf_011', levelNumber: 11, x: 72, y: 22, fen: 'r1b2r1k/ppp2p1p/2n5/4p3/2B5/6R1/PPP2PPP/3R2K1 w - - 0 1', solution: 'Bxf7#', rating: 970, title: 'Elven Haven' },
  { id: 'vf_012', levelNumber: 12, x: 50, y: 15, fen: 'r2qk2r/ppp2ppp/2n5/3np3/2B5/3P1Q2/PPP2PPP/R1B1K2R w KQkq - 0 1', solution: 'Qxf7#', rating: 1020, title: 'Forest Crown' },
  { id: 'vf_013', levelNumber: 13, x: 25, y: 8, fen: '6k1/R7/5p2/6pp/7P/6PK/8/6r1 b - - 0 1', solution: 'g4#', rating: 1070, title: 'Grand Canopy' },
];

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
