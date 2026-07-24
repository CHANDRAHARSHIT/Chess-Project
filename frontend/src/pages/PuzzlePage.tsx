import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { RoyalGoldPathway, ROYAL_GOLD_NODES } from '../components/pathways/RoyalGold/RoyalGoldPathway';
import { PATHWAY_NODES } from '../components/pathways';
import type { PathNode, PlayerProgress } from '../types/PuzzlePath';
import { PuzzleBoard } from '../components/PuzzleBoard';
import type { ChessPuzzle } from '../utils/PuzzleLoader';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Chess } from 'chess.js';
import { Confetti } from '../components/Confetti';

export default function PuzzlePage() {
  const navigate = useNavigate();

  // Mobile View State: 'pathway' (default) or 'board'
  const [mobileView, setMobileView] = useState<'pathway' | 'board'>('pathway');

  const activePathwayNodes = useMemo(() => {
    return ROYAL_GOLD_NODES || PATHWAY_NODES['RoyalGold'];
  }, []);

  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('xlchess_completed_puzzles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [streak, setStreak] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('xlchess_puzzle_streak') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [solvedCount, setSolvedCount] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('xlchess_puzzle_solved') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [showConfetti, setShowConfetti] = useState(false);

  // Active selected puzzle node
  const [selectedNode, setSelectedNode] = useState<PathNode | null>(() => {
    return activePathwayNodes[0] || null;
  });

  // Compute current player progress
  const playerProgress: PlayerProgress = useMemo(() => {
    return {
      completedPuzzleIds: completedIds,
      currentPuzzleId: selectedNode?.id || activePathwayNodes[0]?.id || 'placeholder_004',
      streak,
      totalSolved: solvedCount,
    };
  }, [completedIds, selectedNode?.id, activePathwayNodes, streak, solvedCount]);

  // Defensive validation of active chess puzzle
  const safeChessPuzzle: ChessPuzzle = useMemo(() => {
    const defaultNode = activePathwayNodes[0];
    const targetNode = selectedNode || defaultNode;

    try {
      if (targetNode?.fen) {
        new Chess(targetNode.fen); // Validate FEN syntax
      }
      return {
        id: targetNode?.id || defaultNode?.id || 'placeholder_004',
        fen: targetNode?.fen || defaultNode?.fen || 'rnbqkn1r/ppppp2p/5p2/6p1/4P3/3P4/PPP2PPP/RNBQKBNR w KQkq - 0 3',
        solution: targetNode?.solution || defaultNode?.solution || 'Qh5#',
        rating: targetNode?.rating || defaultNode?.rating || 500,
      };
    } catch (e) {
      console.error('Invalid FEN in selected puzzle node, falling back to default:', e);
      return {
        id: defaultNode?.id || 'placeholder_004',
        fen: defaultNode?.fen || 'rnbqkn1r/ppppp2p/5p2/6p1/4P3/3P4/PPP2PPP/RNBQKBNR w KQkq - 0 3',
        solution: defaultNode?.solution || defaultNode?.solution || 'Qh5#',
        rating: defaultNode?.rating || 500,
      };
    }
  }, [selectedNode, activePathwayNodes]);

  // Select node callback from any active pathway component
  const handleSelectNode = useCallback((node: PathNode) => {
    setSelectedNode(node);
    setShowConfetti(false);
    setMobileView('board'); // Purely local state update
  }, []);

  // Return to pathway callback
  const handleReturnToPathway = useCallback(() => {
    setMobileView('pathway');
  }, []);

  // Advance to next puzzle in active pathway
  const handleNextPuzzle = useCallback(() => {
    if (!selectedNode) {
      if (activePathwayNodes.length > 0) setSelectedNode(activePathwayNodes[0]);
      return;
    }
    const currentIndex = activePathwayNodes.findIndex(
      n => n.id === selectedNode.id || n.levelNumber === selectedNode.levelNumber
    );
    if (currentIndex >= 0 && currentIndex < activePathwayNodes.length - 1) {
      const nextNode = activePathwayNodes[currentIndex + 1];
      setSelectedNode(nextNode);
      setShowConfetti(false);
    }
  }, [selectedNode, activePathwayNodes]);

  // Mobile-specific Next Puzzle handler (advances node and returns to pathway view)
  const handleNextPuzzleMobile = useCallback(() => {
    handleNextPuzzle();
    setMobileView('pathway');
  }, [handleNextPuzzle]);

  // Solve callback from left puzzle board
  const handleSolved = useCallback(() => {
    setShowConfetti(true);

    if (selectedNode) {
      setCompletedIds(prev => {
        if (prev.includes(selectedNode.id)) return prev;
        const updated = [...prev, selectedNode.id];
        try { localStorage.setItem('xlchess_completed_puzzles', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }

    setStreak(prev => {
      const next = prev + 1;
      try { localStorage.setItem('xlchess_puzzle_streak', next.toString()); } catch (e) {}
      return next;
    });

    setSolvedCount(prev => {
      const next = prev + 1;
      try { localStorage.setItem('xlchess_puzzle_solved', next.toString()); } catch (e) {}
      return next;
    });
  }, [selectedNode]);

  // Failed callback from left puzzle board
  const handleFailed = useCallback(() => {
    setStreak(0);
    try { localStorage.setItem('xlchess_puzzle_streak', '0'); } catch (e) {}
  }, []);

  const handleNavigateHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col relative select-none pb-16 pt-20 sm:pt-8">
      {showConfetti && <Confetti />}

      {/* Ambient Lighting */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[80vw] max-w-[1200px] h-[400px] rounded-full blur-[160px] bg-brand-accent/5 pointer-events-none z-0" />

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-center">

        {/* Top Breadcrumb */}
        <div className="mb-4 flex items-center justify-between w-full">
          <button
            onClick={handleNavigateHome}
            className="flex items-center gap-2.5 text-xs text-brand-secondary hover:text-white transition-all duration-300 cursor-pointer uppercase tracking-wider font-mono font-medium"
          >
            <span className="w-5 h-5 rounded-full border border-brand-border flex items-center justify-center font-bold text-[9px] hover:border-brand-accent/50">
              <ArrowLeft className="w-3 h-3" />
            </span>
            Back to Home
          </button>
        </div>

        {/* DESKTOP VIEW */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-stretch w-full">
          <div className="lg:col-span-7 flex flex-col items-center w-full space-y-6">
            <div className="w-full bg-[#0c1020]/70 backdrop-blur-xl border border-brand-border rounded-2xl p-5 text-left shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-display font-semibold text-white tracking-wide">
                    {selectedNode ? `Level ${selectedNode.levelNumber}: ${selectedNode.title || 'Mate in 1'}` : 'Mate in 1 Tactics'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    Rating {safeChessPuzzle.rating}
                  </span>
                </div>
                <p className="text-xs text-brand-secondary font-sans mt-0.5">
                  {selectedNode?.description || 'Solve tactics to train your checkmate vision.'}
                </p>
              </div>

              <button
                onClick={handleNextPuzzle}
                className="px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Next Level</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex justify-center w-full">
              <PuzzleBoard
                boardId="desktop-puzzle-board"
                puzzle={safeChessPuzzle}
                puzzleNumber={selectedNode?.levelNumber || 1}
                onSolved={handleSolved}
                onFailed={handleFailed}
                onNextPuzzle={handleNextPuzzle}
              />
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col w-full h-full">
            <RoyalGoldPathway
              playerProgress={playerProgress}
              onSelectPuzzle={handleSelectNode}
            />
          </div>
        </div>

        {/* MOBILE VIEW (Driven strictly by local mobileView state) */}
        <div className="lg:hidden w-full flex flex-col">
          {(() => {
            switch (mobileView) {
              case 'board':
                return (
                  <div className="w-full flex flex-col items-center space-y-6">
                    {/* Back to Pathway Navigation Button */}
                    <div className="w-full flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleReturnToPathway}
                        className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Pathway</span>
                      </button>
                    </div>

                    {/* Mobile Board Deck Header Card */}
                    <div className="w-full bg-[#0c1020]/70 backdrop-blur-xl border border-brand-border rounded-2xl p-4 text-left shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-lg font-display font-semibold text-white tracking-wide">
                            {selectedNode ? `Level ${selectedNode.levelNumber}: ${selectedNode.title || 'Mate in 1'}` : 'Mate in 1 Tactics'}
                          </h1>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400">
                            Rating {safeChessPuzzle.rating}
                          </span>
                        </div>
                        <p className="text-xs text-brand-secondary font-sans mt-0.5">
                          {selectedNode?.description || 'Solve tactics to train your checkmate vision.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleNextPuzzleMobile}
                        className="px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <span>Next Level</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Mobile Interactive Chess Board */}
                    <div className="flex justify-center w-full">
                      <PuzzleBoard
                        boardId="mobile-puzzle-board"
                        puzzle={safeChessPuzzle}
                        puzzleNumber={selectedNode?.levelNumber || 1}
                        onSolved={handleSolved}
                        onFailed={handleFailed}
                        onNextPuzzle={handleNextPuzzleMobile}
                      />
                    </div>
                  </div>
                );

              case 'pathway':
              default:
                return (
                  <div className="w-full flex flex-col">
                    <RoyalGoldPathway
                      playerProgress={playerProgress}
                      onSelectPuzzle={handleSelectNode}
                    />
                  </div>
                );
            }
          })()}
        </div>

      </main>
    </div>
  );
}
