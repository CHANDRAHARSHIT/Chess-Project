import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { RoyalGoldPathway } from '../components/pathways/RoyalGold/RoyalGoldPathway';
import { ROYAL_GOLD_NODES } from '../components/pathways/RoyalGold/royalGoldNodes';
import { PATHWAY_NODES } from '../components/pathways';
import type { PathNode, PlayerProgress } from '../types/PuzzlePath';
import { PuzzleBoard } from '../components/PuzzleBoard';
import { CustomPuzzlePanel } from '../components/CustomPuzzlePanel';
import { CustomPuzzleSession } from '../components/CustomPuzzleSession';
import type { PuzzleFilters } from '../types/puzzle';
import {
  HelpCircle,
  SlidersHorizontal,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import type { ChessPuzzle } from '../utils/PuzzleLoader';
import { Chess } from 'chess.js';
import { Confetti } from '../components/Confetti';

// Tailwind's `lg` breakpoint. Keep in sync with tailwind config if changed.
const DESKTOP_BREAKPOINT_PX = 1024;

/**
 * Tracks whether the viewport is at/above the desktop breakpoint.
 * Used to *actually* mount only one layout tree at a time (desktop vs
 * mobile), rather than mounting both and hiding one with CSS. Mounting
 * both simultaneously double-instantiates PuzzleBoard/ThemedChessboard,
 * which is what was crashing the page on mobile.
 */
function useIsDesktop(breakpointPx: number = DESKTOP_BREAKPOINT_PX): boolean {
  const getMatch = () =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(min-width: ${breakpointPx}px)`).matches
      : true;

  const [isDesktop, setIsDesktop] = useState<boolean>(getMatch);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(`(min-width: ${breakpointPx}px)`);

    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);

    // Sync immediately in case it changed between initial state and mount
    function syncState() { setIsDesktop(mql.matches); }
    syncState();

    if (mql.addEventListener) {
      mql.addEventListener('change', handleChange);
      return () => mql.removeEventListener('change', handleChange);
    } else {
      // Safari < 14 fallback
      mql.addListener(handleChange);
      return () => mql.removeListener(handleChange);
    }
  }, [breakpointPx]);

  return isDesktop;
}

export default function PuzzlePage() {
  const navigate = useNavigate();

  // ── Right-panel mode: 'pathway' | 'config' ──────────────────────────────────
  const [rightPanelMode, setRightPanelMode] = useState<'pathway' | 'config'>('pathway');

  // Active custom session filters (null = no session running)
  const [customFilters, setCustomFilters] = useState<PuzzleFilters | null>(null);

  // Mobile view state
  const [mobileView, setMobileView] = useState<'pathway' | 'board'>('pathway');

  // Real (not CSS-only) desktop/mobile split — see useIsDesktop above.
  const isDesktop = useIsDesktop();

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
        new Chess(targetNode.fen);
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
        solution: defaultNode?.solution || 'Qh5#',
        rating: defaultNode?.rating || 500,
      };
    }
  }, [selectedNode, activePathwayNodes]);

  // Select node callback from pathway
  const handleSelectNode = useCallback((node: PathNode) => {
    setSelectedNode(node);
    setShowConfetti(false);
    setMobileView('board');
  }, []);

  // Return to pathway callback (mobile)
  const handleReturnToPathway = useCallback(() => {
    setMobileView('pathway');
  }, []);

  const isCurrentNodeCompleted = useMemo(() => {
    if (!selectedNode) return false;
    return completedIds.includes(selectedNode.id);
  }, [selectedNode, completedIds]);

  const currentPathwayIndex = useMemo(() => {
    if (!selectedNode) return -1;
    return activePathwayNodes.findIndex(
      n => n.id === selectedNode.id || n.levelNumber === selectedNode.levelNumber
    );
  }, [selectedNode, activePathwayNodes]);

  const hasNextNode = currentPathwayIndex >= 0 && currentPathwayIndex < activePathwayNodes.length - 1;
  const isNextEnabled = hasNextNode && isCurrentNodeCompleted;

  // Advance to next puzzle in active pathway
  const handleNextPuzzle = useCallback(() => {
    if (!selectedNode) {
      if (activePathwayNodes.length > 0) setSelectedNode(activePathwayNodes[0]);
      return;
    }
    if (!completedIds.includes(selectedNode.id)) return;

    const currentIndex = activePathwayNodes.findIndex(
      n => n.id === selectedNode.id || n.levelNumber === selectedNode.levelNumber
    );
    if (currentIndex >= 0 && currentIndex < activePathwayNodes.length - 1) {
      const nextNode = activePathwayNodes[currentIndex + 1];
      setSelectedNode(nextNode);
      setShowConfetti(false);
    }
  }, [selectedNode, activePathwayNodes, completedIds]);

  // Mobile-specific Next Puzzle (advances + returns to pathway view)
  const handleNextPuzzleMobile = useCallback(() => {
    if (!selectedNode || !completedIds.includes(selectedNode.id)) return;
    handleNextPuzzle();
    setMobileView('pathway');
  }, [handleNextPuzzle, selectedNode, completedIds]);

  // Solve callback from left puzzle board
  const handleSolved = useCallback(() => {
    setShowConfetti(true);

    if (selectedNode) {
      setCompletedIds(prev => {
        if (prev.includes(selectedNode.id)) return prev;
        const updated = [...prev, selectedNode.id];
        try { localStorage.setItem('xlchess_completed_puzzles', JSON.stringify(updated)); } catch { /* empty */ }
        return updated;
      });
    }

    setStreak(prev => {
      const next = prev + 1;
      try { localStorage.setItem('xlchess_puzzle_streak', next.toString()); } catch { /* empty */ }
      return next;
    });

    setSolvedCount(prev => {
      const next = prev + 1;
      try { localStorage.setItem('xlchess_puzzle_solved', next.toString()); } catch { /* empty */ }
      return next;
    });
  }, [selectedNode]);

  // Failed callback from left puzzle board
  const handleFailed = useCallback(() => {
    setStreak(0);
    try { localStorage.setItem('xlchess_puzzle_streak', '0'); } catch { /* empty */ }
  }, []);

  const handleNavigateHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // ── Custom Puzzle handlers ──────────────────────────────────────────────────

  const handleOpenCustomConfig = useCallback(() => {
    setRightPanelMode('config');
  }, []);

  const handleCloseCustomConfig = useCallback(() => {
    setRightPanelMode('pathway');
  }, []);

  const handleStartCustomSession = useCallback((filters: PuzzleFilters) => {
    setRightPanelMode('pathway');
    setCustomFilters(filters);
  }, []);

  const handleExitCustomSession = useCallback(() => {
    setCustomFilters(null);
  }, []);

  // ── Right panel content selector ─────────────────────────────────────────
  const renderRightPanel = () => {
    if (rightPanelMode === 'config') {
      return (
        <div className="flex flex-col w-full h-full">
          <CustomPuzzlePanel
            onStart={handleStartCustomSession}
            onClose={handleCloseCustomConfig}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col w-full h-full gap-4 relative">
        <div className="relative z-10 flex-1 min-h-0">
          <RoyalGoldPathway
            playerProgress={playerProgress}
            onSelectPuzzle={handleSelectNode}
          />
        </div>

        <div className="relative z-20 flex-shrink-0">
          <button
            id="custom-puzzles-btn"
            onClick={handleOpenCustomConfig}
            className="w-full flex items-center justify-center gap-2 px-4.5 py-3.5 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all duration-300 cursor-pointer bg-brand-surface border border-brand-accent/35 text-brand-accent hover:border-brand-accent/60 shadow-md shadow-brand-accent/10 hover:shadow-lg hover:shadow-brand-accent/20 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,110,0.14) 0%, rgba(184,147,74,0.08) 100%), var(--obsidian-mid)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "linear-gradient(135deg, rgba(212,175,110,0.22) 0%, rgba(184,147,74,0.14) 100%), var(--obsidian-mid)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "linear-gradient(135deg, rgba(212,175,110,0.14) 0%, rgba(184,147,74,0.08) 100%), var(--obsidian-mid)";
            }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-accent" />
            <span>Custom Puzzles</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col relative select-none pb-16 pt-20 sm:pt-8">
      {showConfetti && <Confetti />}

      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[80vw] max-w-[1200px] h-[400px] rounded-full blur-[160px] bg-brand-accent/5 pointer-events-none z-0" />

      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-center">

        <div className="mb-4 flex items-center justify-between w-full">
          <button
            onClick={handleNavigateHome}
            className="flex items-center gap-2.5 text-xs text-brand-secondary hover:text-brand-text transition-all duration-300 cursor-pointer uppercase tracking-wider font-mono font-medium"
          >
            <span className="w-5 h-5 rounded-full border border-brand-border flex items-center justify-center font-bold text-[9px] hover:border-brand-accent/50">
              <ArrowLeft className="w-3 h-3" />
            </span>
            Back to Home
          </button>

          {customFilters && (
            <button
              onClick={handleExitCustomSession}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-200 cursor-pointer"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#F87171",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.14)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
              }}
            >
              ✕ Exit Session
            </button>
          )}
        </div>

        {customFilters ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start w-full">
            <div className="lg:col-span-7 flex justify-center w-full">
              <CustomPuzzleSession
                filters={customFilters}
                onExit={handleExitCustomSession}
              />
            </div>

            <div className="lg:col-span-5 flex flex-col space-y-6">
              <div
                className="rounded-2xl p-6 text-left shadow-2xl relative overflow-hidden bg-brand-surface/80 backdrop-blur-xl border border-brand-border/40"
              >
                <div
                  className="absolute top-0 right-0 w-[150px] h-[150px] pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at top right, rgba(212,175,110,0.05) 0%, transparent 70%)",
                  }}
                />
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-brand-border/40">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-brand-accent/10 border border-brand-accent/20">
                    <SlidersHorizontal className="w-4 h-4 text-brand-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-brand-text font-display">
                      Custom Session
                    </h2>
                    <p className="text-xs mt-0.5 text-brand-secondary">
                      Rated {customFilters.minRating ?? 0} – {customFilters.maxRating ?? 3000}
                    </p>
                  </div>
                </div>
                {customFilters.themes && customFilters.themes.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest mb-2 text-brand-secondary">
                      Active Themes
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {customFilters.themes.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(!customFilters.themes || customFilters.themes.length === 0) && (
                  <p className="text-xs text-brand-secondary">
                    All themes included in this session.
                  </p>
                )}
              </div>


              <div className="bg-brand-surface/30 backdrop-blur-sm border border-brand-border/60 rounded-2xl p-5 text-left flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-brand-accent/10 border border-brand-accent/20 text-brand-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-mono text-brand-text uppercase tracking-wider font-semibold mb-1">
                    Tactics Training Advice
                  </h4>
                  <p className="text-xs text-brand-secondary font-sans leading-relaxed">
                    Puzzles are sorted by rating — easiest first. After solving, click "Next Puzzle" to advance. Incorrect moves auto-reset so you can try again.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : isDesktop ? (
          /* ── DESKTOP VIEW (only mounted when isDesktop is true) ──────────── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
            <div className="lg:col-span-7 flex flex-col items-center w-full space-y-6">
              <div className="w-full bg-brand-surface/70 backdrop-blur-xl border border-brand-border rounded-2xl p-5 text-left shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-display lining-nums font-semibold text-brand-text tracking-wide">
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
                  type="button"
                  onClick={handleNextPuzzle}
                  disabled={!isNextEnabled}
                  className="px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-500 disabled:shadow-none"
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
                  isNextDisabled={!isNextEnabled}
                />
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col w-full h-full">
              {renderRightPanel()}
            </div>
          </div>
        ) : (
          /* ── MOBILE VIEW (only mounted when isDesktop is false) ──────────── */
          <div className="w-full flex flex-col">
            {(() => {
              switch (mobileView) {
                case 'board':
                  return (
                    <div className="w-full flex flex-col items-center space-y-6">
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

                      <div className="w-full bg-brand-surface/70 backdrop-blur-xl border border-brand-border rounded-2xl p-4 text-left shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h1 className="text-lg font-display lining-nums font-semibold text-brand-text tracking-wide">
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
                          disabled={!isNextEnabled}
                          className="px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-500 disabled:shadow-none"
                        >
                          <span>Next Level</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex justify-center w-full">
                        <PuzzleBoard
                          boardId="mobile-puzzle-board"
                          puzzle={safeChessPuzzle}
                          puzzleNumber={selectedNode?.levelNumber || 1}
                          onSolved={handleSolved}
                          onFailed={handleFailed}
                          onNextPuzzle={handleNextPuzzleMobile}
                          isNextDisabled={!isNextEnabled}
                        />
                      </div>
                    </div>
                  );

                case 'pathway':
                default:
                  if (rightPanelMode === 'config') {
                    return (
                      <div className="w-full">
                        <CustomPuzzlePanel
                          onStart={handleStartCustomSession}
                          onClose={handleCloseCustomConfig}
                        />
                      </div>
                    );
                  }
                  return (
                    <div className="w-full flex flex-col gap-4 relative">
                      <div className="relative z-10">
                        <RoyalGoldPathway
                          playerProgress={playerProgress}
                          onSelectPuzzle={handleSelectNode}
                        />
                      </div>
                      <div className="relative z-20">
                        <button
                          id="custom-puzzles-btn-mobile"
                          onClick={handleOpenCustomConfig}
                          className="w-full flex items-center justify-center gap-2 px-4.5 py-3.5 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all duration-300 cursor-pointer bg-brand-surface border border-brand-accent/35 text-brand-accent hover:border-brand-accent/60 shadow-md shadow-brand-accent/10 hover:shadow-lg hover:shadow-brand-accent/20 hover:-translate-y-0.5"
                          style={{
                            background: "linear-gradient(135deg, rgba(212,175,110,0.14) 0%, rgba(184,147,74,0.08) 100%), var(--obsidian-mid)",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background =
                              "linear-gradient(135deg, rgba(212,175,110,0.22) 0%, rgba(184,147,74,0.14) 100%), var(--obsidian-mid)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background =
                              "linear-gradient(135deg, rgba(212,175,110,0.14) 0%, rgba(184,147,74,0.08) 100%), var(--obsidian-mid)";
                          }}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-brand-accent" />
                          <span>Custom Puzzles</span>
                        </button>
                      </div>
                    </div>
                  );
              }
            })()}
          </div>
        )}

      </main>
    </div>
  );
}