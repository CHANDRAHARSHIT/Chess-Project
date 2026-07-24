import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { PathwayComponentProps, PathNode, PuzzleTileState } from '../../../types/PuzzlePath';
import { Lock, Check, Snowflake } from 'lucide-react';
import bgImage from '../../../assets/Plain_BG.png';
import tileImage from '../../../assets/Tile.png';
import './CrystalPathway.css';

export const CRYSTAL_NODES: PathNode[] = [
  { id: 'cr_001', levelNumber: 1, x: 50, y: 90, fen: 'rnbqkn1r/ppppp2p/5p2/6p1/4P3/3P4/PPP2PPP/RNBQKBNR w KQkq - 0 3', solution: 'Qh5#', rating: 500, title: 'Glacial Gateway' },
  { id: 'cr_002', levelNumber: 2, x: 78, y: 83, fen: 'rnbqk1nr/ppp2ppp/3p4/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4', solution: 'Qxf7#', rating: 570, title: 'Frost Spire' },
  { id: 'cr_003', levelNumber: 3, x: 60, y: 76, fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4', solution: 'Qxf7#', rating: 610, title: 'Ice Cavern' },
  { id: 'cr_004', levelNumber: 4, x: 25, y: 69, fen: 'r1bqk2r/ppp2ppp/2np4/2b1p3/2B1P1n1/2NP1Q2/PPP2PPP/R1B1K1NR w KQkq - 2 6', solution: 'Qxf7#', rating: 640, title: 'Crystal Bridge' },
  { id: 'cr_005', levelNumber: 5, x: 38, y: 62, fen: '7k/5Qpp/8/8/8/8/8/6K1 w - - 0 1', solution: 'Qf8#', rating: 680, title: 'Frozen Citadel' },
  { id: 'cr_006', levelNumber: 6, x: 72, y: 55, fen: '6k1/5ppp/8/8/8/2Q5/5PPP/6K1 w - - 0 1', solution: 'Qc8#', rating: 720, title: 'Cyan Peak' },
  { id: 'cr_007', levelNumber: 7, x: 50, y: 48, fen: '6k1/5ppp/8/8/8/8/1R3PPP/6K1 w - - 0 1', solution: 'Rb8#', rating: 750, title: 'Glacial Ridge' },
  { id: 'cr_008', levelNumber: 8, x: 22, y: 41, fen: '3r2k1/5ppp/8/8/8/8/1Q3PPP/3R2K1 w - - 0 1', solution: 'Rxd8#', rating: 790, title: 'Frost Bite' },
  { id: 'cr_009', levelNumber: 9, x: 45, y: 34, fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', solution: 'Rd8#', rating: 830, title: 'Ice Summit' },
  { id: 'cr_010', levelNumber: 10, x: 75, y: 27, fen: '8/8/8/8/8/6k1/6rp/7K b - - 0 1', solution: 'Rg1#', rating: 930, title: 'Aurora Crown' },
  { id: 'cr_011', levelNumber: 11, x: 50, y: 20, fen: 'r1b2r1k/ppp2p1p/2n5/4p3/2B5/6R1/PPP2PPP/3R2K1 w - - 0 1', solution: 'Bxf7#', rating: 980, title: 'Crystal Apex' },
  { id: 'cr_012', levelNumber: 12, x: 25, y: 12, fen: 'r2qk2r/ppp2ppp/2n5/3np3/2B5/3P1Q2/PPP2PPP/R1B1K2R w KQkq - 0 1', solution: 'Qxf7#', rating: 1030, title: 'Diamond Pinnacle' },
];

export const CrystalPathway: React.FC<PathwayComponentProps> = ({
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
    if (!currentId && CRYSTAL_NODES.length > 0) {
      const firstUncompleted = CRYSTAL_NODES.find(n => !completedSet.has(n.id));
      currentId = firstUncompleted ? firstUncompleted.id : CRYSTAL_NODES[CRYSTAL_NODES.length - 1].id;
    }
    CRYSTAL_NODES.forEach((node, i) => {
      if (completedSet.has(node.id)) {
        states[node.id] = 'completed';
      } else if (node.id === currentId || i === 0 || (i > 0 && completedSet.has(CRYSTAL_NODES[i - 1].id))) {
        states[node.id] = 'current';
      } else {
        states[node.id] = 'locked';
      }
    });
    return states;
  }, [playerProgress]);

  return (
    <div ref={containerRef} className="crystal-container">
      {/* Background Image */}
      <div className="crystal-bg" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="crystal-vignette" />
      </div>

      {/* Beams */}
      {dimensions.width > 0 && dimensions.height > 0 &&
        CRYSTAL_NODES.map((node, i) => {
          if (i === CRYSTAL_NODES.length - 1) return null;
          const nextNode = CRYSTAL_NODES[i + 1];
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
              key={`crystal-beam-${node.id}-${nextNode.id}`}
              className="crystal-beam-wrap"
              style={{
                left: `${midX}px`,
                top: `${midY}px`,
                width: `${distance}px`,
                height: '14px',
                transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
              }}
            >
              <div className={`crystal-beam ${isUnlocked ? 'crystal-beam-unlocked' : 'crystal-beam-locked'}`} />
            </div>
          );
        })}

      {/* Tiles */}
      {CRYSTAL_NODES.map((node) => {
        const state = nodeStates[node.id] || 'locked';
        const isLocked = state === 'locked';
        const isCurrent = state === 'current';
        const isCompleted = state === 'completed';

        return (
          <div
            key={`crystal-tile-${node.id}`}
            className="crystal-tile-wrap"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <button
              type="button"
              onClick={() => !isLocked && onSelectPuzzle(node)}
              disabled={isLocked}
              aria-label={`Level ${node.levelNumber}`}
              className="crystal-tile-button"
            >
              {isCurrent && <div className="crystal-active-aura" />}

              <img
                src={tileImage}
                alt={`Tile ${node.levelNumber}`}
                className={`crystal-tile-img ${isCurrent ? 'crystal-current-img' : ''}`}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`crystal-number ${isCurrent ? 'crystal-number-current' : ''}`}>
                  {node.levelNumber}
                </span>
              </div>

              {isLocked && (
                <div className="crystal-badge crystal-badge-locked">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              {isCompleted && (
                <div className="crystal-badge crystal-badge-completed">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {isCurrent && (
                <div className="crystal-badge crystal-badge-current">
                  <Snowflake className="w-3.5 h-3.5 fill-current text-slate-950" />
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
