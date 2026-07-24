import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { PathwayComponentProps, PathNode, PuzzleTileState } from '../../../types/PuzzlePath';
import { Lock, Check, Crown } from 'lucide-react';
import bgImage from '../../../assets/Background-w-assets.png';
import tileImage from '../../../assets/Tile.png';
import './RoyalPurplePathway.css';

export const ROYAL_PURPLE_NODES: PathNode[] = [
  { id: 'placeholder_004', levelNumber: 1, x: 48, y: 92, fen: 'rnbqkn1r/ppppp2p/5p2/6p1/4P3/3P4/PPP2PPP/RNBQKBNR w KQkq - 0 3', solution: 'Qh5#', rating: 500, title: "Fool's Quick Mate" },
  { id: 'placeholder_008', levelNumber: 2, x: 65, y: 80, fen: 'rnbqk1nr/ppp2ppp/3p4/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4', solution: 'Qxf7#', rating: 580, title: "Scholar's Strike" },
  { id: 'placeholder_002', levelNumber: 3, x: 45, y: 72, fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4', solution: 'Qxf7#', rating: 600, title: 'Italian Blitz' },
  { id: 'placeholder_009', levelNumber: 4, x: 60, y: 62, fen: 'r1bqk2r/ppp2ppp/2np4/2b1p3/2B1P1n1/2NP1Q2/PPP2PPP/R1B1K1NR w KQkq - 2 6', solution: 'Qxf7#', rating: 620, title: 'Tactical Breach' },
  { id: 'placeholder_003', levelNumber: 5, x: 39, y: 54, fen: '7k/5Qpp/8/8/8/8/8/6K1 w - - 0 1', solution: 'Qf8#', rating: 650, title: 'Cornered King' },
  { id: 'placeholder_006', levelNumber: 6, x: 56, y: 42, fen: '6k1/5ppp/8/8/8/2Q5/5PPP/6K1 w - - 0 1', solution: 'Qc8#', rating: 700, title: 'Queen Back Rank' },
  { id: 'placeholder_007', levelNumber: 7, x: 40, y: 38, fen: '6k1/5ppp/8/8/8/8/1R3PPP/6K1 w - - 0 1', solution: 'Rb8#', rating: 720, title: 'Rook Roller' },
  // { id: 'placeholder_005', levelNumber: 8, x: 62, y: 48, fen: '3r2k1/5ppp/8/8/8/8/1Q3PPP/3R2K1 w - - 0 1', solution: 'Rxd8#', rating: 750, title: 'Rook Exchange Mate' },
  // { id: 'placeholder_001', levelNumber: 9, x: 36, y: 42, fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', solution: 'Rd8#', rating: 800, title: 'Classic Back Rank' },
  // { id: 'placeholder_010', levelNumber: 10, x: 22, y: 36, fen: '8/8/8/8/8/6k1/6rp/7K b - - 0 1', solution: 'Rg1#', rating: 900, title: 'Corner Trap' },
  // { id: 'rg_011', levelNumber: 11, x: 40, y: 30, fen: 'r1b2r1k/ppp2p1p/2n5/4p3/2B5/6R1/PPP2PPP/3R2K1 w - - 0 1', solution: 'Bxf7#', rating: 950, title: 'Knights Infiltration' },
  // { id: 'rg_012', levelNumber: 12, x: 68, y: 24, fen: 'r2qk2r/ppp2ppp/2n5/3np3/2B5/3P1Q2/PPP2PPP/R1B1K2R w KQkq - 0 1', solution: 'Qxf7#', rating: 1000, title: 'Italian Pinpoint' },
  // { id: 'rg_013', levelNumber: 13, x: 78, y: 18, fen: '6k1/R7/5p2/6pp/7P/6PK/8/6r1 b - - 0 1', solution: 'g4#', rating: 1050, title: 'Pawn Advance' },
  // { id: 'rg_014', levelNumber: 14, x: 52, y: 12, fen: 'r1bqkbnr/pppp1ppp/8/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1', solution: 'Qxf7#', rating: 1100, title: 'Canopy Assault' },
  // { id: 'rg_015', levelNumber: 15, x: 26, y: 6, fen: '5rk1/pp3ppp/8/8/8/8/PP3PPP/3RR1K1 w - - 0 1', solution: 'Re8#', rating: 1150, title: 'Highland Overlook' },
];

export const RoyalPurplePathway: React.FC<PathwayComponentProps> = ({
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
    if (!currentId && ROYAL_PURPLE_NODES.length > 0) {
      const firstUncompleted = ROYAL_PURPLE_NODES.find(n => !completedSet.has(n.id));
      currentId = firstUncompleted ? firstUncompleted.id : ROYAL_PURPLE_NODES[ROYAL_PURPLE_NODES.length - 1].id;
    }
    ROYAL_PURPLE_NODES.forEach((node, i) => {
      if (completedSet.has(node.id)) {
        states[node.id] = 'completed';
      } else if (node.id === currentId || i === 0 || (i > 0 && completedSet.has(ROYAL_PURPLE_NODES[i - 1].id))) {
        states[node.id] = 'current';
      } else {
        states[node.id] = 'locked';
      }
    });
    return states;
  }, [playerProgress]);

  return (
    <div ref={containerRef} className="royal-purple-container">
      {/* Background Image */}
      <div className="royal-purple-bg" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="royal-purple-vignette" />
      </div>

      {/* Beams */}
      {dimensions.width > 0 && dimensions.height > 0 &&
        ROYAL_PURPLE_NODES.map((node, i) => {
          if (i === ROYAL_PURPLE_NODES.length - 1) return null;
          const nextNode = ROYAL_PURPLE_NODES[i + 1];
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
              key={`rp-beam-${node.id}-${nextNode.id}`}
              className="royal-purple-beam-wrap"
              style={{
                left: `${midX}px`,
                top: `${midY}px`,
                width: `${distance}px`,
                height: '14px',
                transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
              }}
            >
              <div className={`royal-purple-beam ${isUnlocked ? 'royal-purple-beam-unlocked' : 'royal-purple-beam-locked'}`} />
            </div>
          );
        })}

      {/* Tiles */}
      {ROYAL_PURPLE_NODES.map((node) => {
        const state = nodeStates[node.id] || 'locked';
        const isLocked = state === 'locked';
        const isCurrent = state === 'current';
        const isCompleted = state === 'completed';

        return (
          <div
            key={`rp-tile-${node.id}`}
            className="royal-purple-tile-wrap"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <button
              type="button"
              onClick={() => !isLocked && onSelectPuzzle(node)}
              disabled={isLocked}
              aria-label={`Level ${node.levelNumber}`}
              className="royal-purple-tile-button"
            >
              {isCurrent && <div className="royal-purple-active-aura" />}

              <img
                src={tileImage}
                alt={`Tile ${node.levelNumber}`}
                className={`royal-purple-tile-img ${isCurrent ? 'royal-purple-current-img' : ''}`}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`royal-purple-number ${isCurrent ? 'royal-purple-number-current' : ''}`}>
                  {node.levelNumber}
                </span>
              </div>

              {isLocked && (
                <div className="royal-purple-badge royal-purple-badge-locked">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              {isCompleted && (
                <div className="royal-purple-badge royal-purple-badge-completed">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {isCurrent && (
                <div className="royal-purple-badge royal-purple-badge-current">
                  <Crown className="w-3.5 h-3.5 fill-current text-amber-300" />
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
