const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');

// 1. CrystalPathway
const crystalContent = `import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { PathwayComponentProps, PuzzleTileState } from '@/types/puzzles-pathway.types';
import { Lock, Check, Snowflake } from 'lucide-react';
import bgImage from '@/assets/Plain_BG.png';
import tileImage from '@/assets/Tile.png';
import { CRYSTAL_NODES } from '@/data/puzzles-crystalNodes';

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
    <div ref={containerRef} className="relative w-full h-[640px] overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#031525] select-none">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: \`url(\${bgImage})\`, filter: 'hue-rotate(180deg) saturate(150%)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#031525]/90 via-[#031525]/50 to-[#031525]/95 pointer-events-none" />
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
              key={\`crystal-beam-\${node.id}-\${nextNode.id}\`}
              className="absolute pointer-events-none z-10"
              style={{
                left: \`\${midX}px\`,
                top: \`\${midY}px\`,
                width: \`\${distance}px\`,
                height: '14px',
                transform: \`translate(-50%, -50%) rotate(\${angleDeg}deg)\`,
              }}
            >
              <div
                className={\`w-full h-full rounded-full transition-all duration-500 \${
                  isUnlocked
                    ? 'bg-gradient-to-r from-cyan-400 via-sky-100 to-cyan-400 opacity-95'
                    : 'bg-[#083344]/60 border border-cyan-900/40 opacity-40'
                }\`}
              />
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
            key={\`crystal-tile-\${node.id}\`}
            className="absolute z-20 transition-transform duration-300 hover:scale-110 -translate-x-1/2 -translate-y-1/2"
            style={{ left: \`\${node.x}%\`, top: \`\${node.y}%\` }}
          >
            <button
              type="button"
              onClick={() => !isLocked && onSelectPuzzle(node)}
              disabled={isLocked}
              aria-label={\`Level \${node.levelNumber}\`}
              className="relative flex items-center justify-center w-20 h-20 sm:w-[5.5rem] sm:h-[5.5rem] select-none bg-transparent border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:grayscale"
            >
              {isCurrent && (
                <div className="absolute inset-0 rounded-full bg-cyan-500/50 blur-md animate-pulse pointer-events-none" />
              )}

              <img
                src={tileImage}
                alt={\`Tile \${node.levelNumber}\`}
                className={\`w-full h-full object-contain transition-all duration-300 \${
                  isCurrent ? 'scale-110 brightness-125' : ''
                }\`}
                style={{ filter: 'hue-rotate(160deg)' }}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={\`font-['Bonheur_Royale'] text-4xl font-bold leading-none text-cyan-200 \${
                  isCurrent ? 'text-cyan-300 font-extrabold scale-110' : ''
                }\`}>
                  {node.levelNumber}
                </span>
              </div>

              {isLocked && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-cyan-950/90 border border-cyan-700 text-cyan-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              {isCompleted && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-cyan-600 border border-cyan-300 text-white">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-cyan-400 border border-sky-200 text-slate-950 animate-bounce">
                  <Snowflake className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
export default CrystalPathway;
`;
fs.writeFileSync(path.join(srcDir, 'components/puzzles-CrystalPathway.tsx'), crystalContent, 'utf8');

// 2. InfernoPathway
const infernoContent = `import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { PathwayComponentProps, PuzzleTileState } from '@/types/puzzles-pathway.types';
import { Lock, Check, Flame } from 'lucide-react';
import bgImage from '@/assets/Plain_BG.png';
import tileImage from '@/assets/Tile.png';
import { INFERNO_NODES } from '@/data/puzzles-infernoNodes';

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
    <div ref={containerRef} className="relative w-full h-[640px] overflow-hidden rounded-2xl border border-orange-500/40 bg-[#1f0505] select-none">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: \`url(\${bgImage})\`, filter: 'hue-rotate(-40deg) saturate(160%)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f0505]/90 via-[#1f0505]/50 to-[#1f0505]/95 pointer-events-none" />
      </div>

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
              key={\`inferno-beam-\${node.id}-\${nextNode.id}\`}
              className="absolute pointer-events-none z-10"
              style={{
                left: \`\${midX}px\`,
                top: \`\${midY}px\`,
                width: \`\${distance}px\`,
                height: '14px',
                transform: \`translate(-50%, -50%) rotate(\${angleDeg}deg)\`,
              }}
            >
              <div
                className={\`w-full h-full rounded-full transition-all duration-500 \${
                  isUnlocked
                    ? 'bg-gradient-to-r from-orange-500 via-amber-200 to-red-500 opacity-95'
                    : 'bg-[#3b0d0c]/60 border border-orange-950/40 opacity-40'
                }\`}
              />
            </div>
          );
        })}

      {INFERNO_NODES.map((node) => {
        const state = nodeStates[node.id] || 'locked';
        const isLocked = state === 'locked';
        const isCurrent = state === 'current';
        const isCompleted = state === 'completed';

        return (
          <div
            key={\`inferno-tile-\${node.id}\`}
            className="absolute z-20 transition-transform duration-300 hover:scale-110 -translate-x-1/2 -translate-y-1/2"
            style={{ left: \`\${node.x}%\`, top: \`\${node.y}%\` }}
          >
            <button
              type="button"
              onClick={() => !isLocked && onSelectPuzzle(node)}
              disabled={isLocked}
              aria-label={\`Level \${node.levelNumber}\`}
              className="relative flex items-center justify-center w-20 h-20 sm:w-[5.5rem] sm:h-[5.5rem] select-none bg-transparent border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:grayscale"
            >
              {isCurrent && (
                <div className="absolute inset-0 rounded-full bg-orange-500/50 blur-md animate-pulse pointer-events-none" />
              )}

              <img
                src={tileImage}
                alt={\`Tile \${node.levelNumber}\`}
                className={\`w-full h-full object-contain transition-all duration-300 \${
                  isCurrent ? 'scale-110 brightness-125' : ''
                }\`}
                style={{ filter: 'hue-rotate(-45deg)' }}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={\`font-['Bonheur_Royale'] text-4xl font-bold leading-none text-orange-200 \${
                  isCurrent ? 'text-amber-300 font-extrabold scale-110' : ''
                }\`}>
                  {node.levelNumber}
                </span>
              </div>

              {isLocked && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-stone-950/90 border border-orange-900 text-orange-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              {isCompleted && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-orange-600 border border-amber-300 text-white">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-orange-500 border border-amber-200 text-slate-950 animate-bounce">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
export default InfernoPathway;
`;
fs.writeFileSync(path.join(srcDir, 'components/puzzles-InfernoPathway.tsx'), infernoContent, 'utf8');

// 3. ObsidianPathway
const obsidianContent = `import React, { useRef, useState, useEffect, useMemo } from 'react';
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
        style={{ backgroundImage: \`url(\${bgImage})\`, filter: 'grayscale(100%) brightness(50%)' }}
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
              key={\`obsidian-beam-\${node.id}-\${nextNode.id}\`}
              className="absolute pointer-events-none z-10"
              style={{
                left: \`\${midX}px\`,
                top: \`\${midY}px\`,
                width: \`\${distance}px\`,
                height: '14px',
                transform: \`translate(-50%, -50%) rotate(\${angleDeg}deg)\`,
              }}
            >
              <div
                className={\`w-full h-full rounded-full transition-all duration-500 \${
                  isUnlocked
                    ? 'bg-gradient-to-r from-slate-400 via-white to-slate-400 opacity-90'
                    : 'bg-slate-900/60 border border-slate-800 opacity-40'
                }\`}
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
            key={\`obsidian-tile-\${node.id}\`}
            className="absolute z-20 transition-transform duration-300 hover:scale-110 -translate-x-1/2 -translate-y-1/2"
            style={{ left: \`\${node.x}%\`, top: \`\${node.y}%\` }}
          >
            <button
              type="button"
              onClick={() => !isLocked && onSelectPuzzle(node)}
              disabled={isLocked}
              aria-label={\`Level \${node.levelNumber}\`}
              className="relative flex items-center justify-center w-20 h-20 sm:w-[5.5rem] sm:h-[5.5rem] select-none bg-transparent border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:grayscale"
            >
              {isCurrent && (
                <div className="absolute inset-0 rounded-full bg-slate-400/40 blur-md animate-pulse pointer-events-none" />
              )}

              <img
                src={tileImage}
                alt={\`Tile \${node.levelNumber}\`}
                className={\`w-full h-full object-contain transition-all duration-300 \${
                  isCurrent ? 'scale-110 brightness-125' : ''
                }\`}
                style={{ filter: 'grayscale(100%) brightness(75%)' }}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={\`font-['Bonheur_Royale'] text-4xl font-bold leading-none text-slate-200 \${
                  isCurrent ? 'text-white font-extrabold scale-110' : ''
                }\`}>
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
`;
fs.writeFileSync(path.join(srcDir, 'components/puzzles-ObsidianPathway.tsx'), obsidianContent, 'utf8');

// 4. RoyalGoldPathway
const royalGoldContent = `import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { PathwayComponentProps, PuzzleTileState } from '@/types/puzzles-pathway.types';
import { Lock, Check, Crown } from 'lucide-react';
import bgImage from '@/assets/Plain_BG.png';
import tileImage from '@/assets/Tile.png';
import { ROYAL_GOLD_NODES } from '@/data/puzzles-royalGoldNodes';

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
    <div ref={containerRef} className="relative w-full h-[640px] overflow-hidden rounded-2xl border border-yellow-500/40 bg-[#1a1305] select-none">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: \`url(\${bgImage})\`, filter: 'hue-rotate(10deg) saturate(160%)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1305]/90 via-[#1a1305]/50 to-[#1a1305]/95 pointer-events-none" />
      </div>

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

          return (
            <div
              key={\`gold-beam-\${node.id}-\${nextNode.id}\`}
              className="absolute pointer-events-none z-10"
              style={{
                left: \`\${midX}px\`,
                top: \`\${midY}px\`,
                width: \`\${distance}px\`,
                height: '14px',
                transform: \`translate(-50%, -50%) rotate(\${angleDeg}deg)\`,
              }}
            >
              <div
                className={\`w-full h-full rounded-full transition-all duration-500 \${
                  isUnlocked
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-100 to-amber-500 opacity-95'
                    : 'bg-[#3b2b0c]/60 border border-yellow-950/40 opacity-40'
                }\`}
              />
            </div>
          );
        })}

      {ROYAL_GOLD_NODES.map((node) => {
        const state = nodeStates[node.id] || 'locked';
        const isLocked = state === 'locked';
        const isCurrent = state === 'current';
        const isCompleted = state === 'completed';

        return (
          <div
            key={\`gold-tile-\${node.id}\`}
            className="absolute z-20 transition-transform duration-300 hover:scale-110 -translate-x-1/2 -translate-y-1/2"
            style={{ left: \`\${node.x}%\`, top: \`\${node.y}%\` }}
          >
            <button
              type="button"
              onClick={() => !isLocked && onSelectPuzzle(node)}
              disabled={isLocked}
              aria-label={\`Level \${node.levelNumber}\`}
              className="relative flex items-center justify-center w-20 h-20 sm:w-[5.5rem] sm:h-[5.5rem] select-none bg-transparent border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:grayscale"
            >
              {isCurrent && (
                <div className="absolute inset-0 rounded-full bg-amber-400/50 blur-md animate-pulse pointer-events-none" />
              )}

              <img
                src={tileImage}
                alt={\`Tile \${node.levelNumber}\`}
                className={\`w-full h-full object-contain transition-all duration-300 \${
                  isCurrent ? 'scale-110 brightness-125' : ''
                }\`}
                style={{ filter: 'hue-rotate(15deg)' }}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={\`font-['Bonheur_Royale'] text-4xl font-bold leading-none text-amber-200 \${
                  isCurrent ? 'text-amber-100 font-extrabold scale-110' : ''
                }\`}>
                  {node.levelNumber}
                </span>
              </div>

              {isLocked && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-yellow-950/90 border border-amber-700 text-amber-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              {isCompleted && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-amber-600 border border-yellow-300 text-white">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-amber-400 border border-yellow-100 text-slate-950 animate-bounce">
                  <Crown className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
export default RoyalGoldPathway;
`;
fs.writeFileSync(path.join(srcDir, 'components/puzzles-RoyalGoldPathway.tsx'), royalGoldContent, 'utf8');

// 5. RoyalPurplePathway
const royalPurpleContent = `import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { PathwayComponentProps, PuzzleTileState } from '@/types/puzzles-pathway.types';
import { Lock, Check, Sparkles } from 'lucide-react';
import bgImage from '@/assets/Plain_BG.png';
import tileImage from '@/assets/Tile.png';
import { ROYAL_PURPLE_NODES } from '@/data/puzzles-royalPurpleNodes';

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
    <div ref={containerRef} className="relative w-full h-[640px] overflow-hidden rounded-2xl border border-purple-500/40 bg-[#17072b] select-none">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: \`url(\${bgImage})\`, filter: 'hue-rotate(240deg) saturate(160%)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#17072b]/90 via-[#17072b]/50 to-[#17072b]/95 pointer-events-none" />
      </div>

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
              key={\`purple-beam-\${node.id}-\${nextNode.id}\`}
              className="absolute pointer-events-none z-10"
              style={{
                left: \`\${midX}px\`,
                top: \`\${midY}px\`,
                width: \`\${distance}px\`,
                height: '14px',
                transform: \`translate(-50%, -50%) rotate(\${angleDeg}deg)\`,
              }}
            >
              <div
                className={\`w-full h-full rounded-full transition-all duration-500 \${
                  isUnlocked
                    ? 'bg-gradient-to-r from-purple-400 via-fuchsia-200 to-purple-500 opacity-95'
                    : 'bg-[#2b0c4a]/60 border border-purple-950/40 opacity-40'
                }\`}
              />
            </div>
          );
        })}

      {ROYAL_PURPLE_NODES.map((node) => {
        const state = nodeStates[node.id] || 'locked';
        const isLocked = state === 'locked';
        const isCurrent = state === 'current';
        const isCompleted = state === 'completed';

        return (
          <div
            key={\`purple-tile-\${node.id}\`}
            className="absolute z-20 transition-transform duration-300 hover:scale-110 -translate-x-1/2 -translate-y-1/2"
            style={{ left: \`\${node.x}%\`, top: \`\${node.y}%\` }}
          >
            <button
              type="button"
              onClick={() => !isLocked && onSelectPuzzle(node)}
              disabled={isLocked}
              aria-label={\`Level \${node.levelNumber}\`}
              className="relative flex items-center justify-center w-20 h-20 sm:w-[5.5rem] sm:h-[5.5rem] select-none bg-transparent border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:grayscale"
            >
              {isCurrent && (
                <div className="absolute inset-0 rounded-full bg-purple-500/50 blur-md animate-pulse pointer-events-none" />
              )}

              <img
                src={tileImage}
                alt={\`Tile \${node.levelNumber}\`}
                className={\`w-full h-full object-contain transition-all duration-300 \${
                  isCurrent ? 'scale-110 brightness-125' : ''
                }\`}
                style={{ filter: 'hue-rotate(240deg)' }}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={\`font-['Bonheur_Royale'] text-4xl font-bold leading-none text-purple-200 \${
                  isCurrent ? 'text-purple-100 font-extrabold scale-110' : ''
                }\`}>
                  {node.levelNumber}
                </span>
              </div>

              {isLocked && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-purple-950/90 border border-purple-800 text-purple-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              {isCompleted && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-purple-600 border border-fuchsia-300 text-white">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-purple-400 border border-purple-100 text-slate-950 animate-bounce">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
export default RoyalPurplePathway;
`;
fs.writeFileSync(path.join(srcDir, 'components/puzzles-RoyalPurplePathway.tsx'), royalPurpleContent, 'utf8');

// 6. VerdantForestPathway
const verdantContent = `import React, { useRef, useState, useEffect, useMemo } from 'react';
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
        style={{ backgroundImage: \`url(\${bgImage})\`, filter: 'hue-rotate(90deg) saturate(150%)' }}
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
              key={\`verdant-beam-\${node.id}-\${nextNode.id}\`}
              className="absolute pointer-events-none z-10"
              style={{
                left: \`\${midX}px\`,
                top: \`\${midY}px\`,
                width: \`\${distance}px\`,
                height: '14px',
                transform: \`translate(-50%, -50%) rotate(\${angleDeg}deg)\`,
              }}
            >
              <div
                className={\`w-full h-full rounded-full transition-all duration-500 \${
                  isUnlocked
                    ? 'bg-gradient-to-r from-emerald-400 via-green-100 to-emerald-500 opacity-95'
                    : 'bg-[#0a3820]/60 border border-emerald-950/40 opacity-40'
                }\`}
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
            key={\`verdant-tile-\${node.id}\`}
            className="absolute z-20 transition-transform duration-300 hover:scale-110 -translate-x-1/2 -translate-y-1/2"
            style={{ left: \`\${node.x}%\`, top: \`\${node.y}%\` }}
          >
            <button
              type="button"
              onClick={() => !isLocked && onSelectPuzzle(node)}
              disabled={isLocked}
              aria-label={\`Level \${node.levelNumber}\`}
              className="relative flex items-center justify-center w-20 h-20 sm:w-[5.5rem] sm:h-[5.5rem] select-none bg-transparent border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:grayscale"
            >
              {isCurrent && (
                <div className="absolute inset-0 rounded-full bg-emerald-500/50 blur-md animate-pulse pointer-events-none" />
              )}

              <img
                src={tileImage}
                alt={\`Tile \${node.levelNumber}\`}
                className={\`w-full h-full object-contain transition-all duration-300 \${
                  isCurrent ? 'scale-110 brightness-125' : ''
                }\`}
                style={{ filter: 'hue-rotate(90deg)' }}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={\`font-['Bonheur_Royale'] text-4xl font-bold leading-none text-emerald-200 \${
                  isCurrent ? 'text-emerald-100 font-extrabold scale-110' : ''
                }\`}>
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
`;
fs.writeFileSync(path.join(srcDir, 'components/puzzles-VerdantForestPathway.tsx'), verdantContent, 'utf8');

console.log('Pathways converted to Tailwind successfully.');
