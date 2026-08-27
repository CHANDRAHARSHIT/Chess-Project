import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { RoyalGoldPathway } from '@/features/puzzles/pathways/RoyalGoldPathway';
import { ROYAL_GOLD_NODES } from '@/features/puzzles/pathways/royalGoldNodes';
import { PATHWAY_NODES } from '@/features/puzzles/pathways';
import type { PathNode, PlayerProgress } from '@/features/puzzles/pathway.types';
import { PuzzleBoard } from '@/features/puzzles/components/PuzzleBoard';
import { PuzzleCoach, CustomPuzzleCoach, type CoachStatus } from '@/features/puzzles/components/PuzzleCoach';
import { ThemedChessboard } from '@/shared/ui/ThemedChessboard';
import { CustomPuzzlePanel } from '@/features/puzzles/components/CustomPuzzlePanel';
import { CustomPuzzleSession } from '@/features/puzzles/components/CustomPuzzleSession';
import type { PuzzleFilters, CuratedPuzzle } from '@/features/puzzles/puzzle.types';
import {
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import type { ChessPuzzle } from '@/features/puzzles/puzzleLoader';
import { Chess } from 'chess.js';
import { Confetti } from '@/shared/ui/Confetti';
import rollbar from '@/shared/lib/rollbar';
import { usePuzzleProgress } from '@/features/puzzles/usePuzzleProgress';
import { motion, AnimatePresence } from 'framer-motion';

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

// Standard chess starting FEN — shown on the static board before any puzzle is selected.
// Kept at module level so it never changes reference across renders.
const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function PuzzlePage() {
  const navigate = useNavigate();

  // ── Right-panel mode: 'pathway' | 'config' ──────────────────────────────────
  const [rightPanelMode, setRightPanelMode] = useState<'pathway' | 'config'>('pathway');

  // Panel display mode — DERIVED from activePuzzleId, not stored directly.
  // This ensures the correct panel is shown on mount/reload without needing
  // a click event to fire first.
  const [activePuzzleId, setActivePuzzleId] = useState<string | null>(null);

  // 'solve' whenever any puzzle is active; 'browse' when the user has
  // explicitly returned to the map (activePuzzleId cleared).
  const panelMode = useMemo<'browse' | 'solve'>(
    () => (activePuzzleId ? 'solve' : 'browse'),
    [activePuzzleId]
  );

  // Coach status lifted from PuzzleBoard callbacks
  const [coachStatus, setCoachStatus] = useState<CoachStatus>('idle');
  const coachResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active custom session filters (null = no session running)
  const [customFilters, setCustomFilters] = useState<PuzzleFilters | null>(null);

  // Custom puzzle coach state
  const [customCoachStatus, setCustomCoachStatus] = useState<CoachStatus>('idle');
  const [currentCustomPuzzle, setCurrentCustomPuzzle] = useState<CuratedPuzzle | null>(null);

  const handleCustomStatusChange = useCallback((status: 'idle' | 'correct' | 'wrong') => {
    setCustomCoachStatus(status);
  }, []);

  // Mobile view state
  const [mobileView, setMobileView] = useState<'pathway' | 'board'>('pathway');

  // Real (not CSS-only) desktop/mobile split — see useIsDesktop above.
  const isDesktop = useIsDesktop();

  const activePathwayNodes = useMemo(() => {
    return ROYAL_GOLD_NODES || PATHWAY_NODES['RoyalGold'];
  }, []);

  // ── Progress — synced to DB for authenticated users, localStorage for guests ──
  const { completedIds, streak, solvedCount, markSolved, markFailed } = usePuzzleProgress();

  const [showConfetti, setShowConfetti] = useState(false);

  // Active selected puzzle node — null until the user explicitly picks one
  const [selectedNode, setSelectedNode] = useState<PathNode | null>(null);

  // Compute current player progress
  const playerProgress: PlayerProgress = useMemo(() => {
    return {
      completedPuzzleIds: completedIds,
      currentPuzzleId: selectedNode?.id || activePathwayNodes[0]?.id || 'placeholder_004',
      streak,
      totalSolved: solvedCount,
    };
  }, [completedIds, selectedNode?.id, activePathwayNodes, streak, solvedCount]);


  // Defensive validation of active chess puzzle.
  // When no puzzle is selected, safeChessPuzzle is not used (PuzzleBoard isn't mounted),
  // but we still compute it to satisfy the type system for the mobile path.
  const safeChessPuzzle: ChessPuzzle = useMemo(() => {
    if (!selectedNode) {
      return { id: '__none__', fen: STARTING_FEN, solution: '', rating: 0 };
    }
    try {
      new Chess(selectedNode.fen || STARTING_FEN);
      return {
        id: selectedNode.id,
        fen: selectedNode.fen || STARTING_FEN,
        solution: selectedNode.solution || '',
        rating: selectedNode.rating || 0,
      };
    } catch (e) {
      console.error('Invalid FEN in selected puzzle node, falling back to starting position:', e);
      rollbar.error(e as Error, { context: 'PuzzlePage.safeChessPuzzle', nodeId: selectedNode.id });
      const fallback = activePathwayNodes[0];
      return {
        id: fallback?.id || '__none__',
        fen: fallback?.fen || STARTING_FEN,
        solution: fallback?.solution || '',
        rating: fallback?.rating || 0,
      };
    }
  }, [selectedNode, activePathwayNodes]);

  // Select node callback from pathway — enters Solve mode
  const handleSelectNode = useCallback((node: PathNode) => {
    setSelectedNode(node);
    setShowConfetti(false);
    setMobileView('board');
    setActivePuzzleId(node.id);
    setCoachStatus('idle');
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
      setCoachStatus('idle');
      setActivePuzzleId(nextNode.id);
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
    setCoachStatus('correct');
    if (selectedNode) {
      markSolved(selectedNode.id);
    }
  }, [selectedNode, markSolved]);

  // Failed callback from left puzzle board
  const handleFailed = useCallback(() => {
    markFailed();
    setCoachStatus('wrong');
    if (coachResetRef.current) clearTimeout(coachResetRef.current);
    coachResetRef.current = setTimeout(() => setCoachStatus('idle'), 1200);
  }, [markFailed]);


  const handleNavigateHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Return to Browse mode — clears activePuzzleId so panelMode derives to 'browse'
  const handleBackToMap = useCallback(() => {
    setActivePuzzleId(null);
  }, []);

  // Cleanup coach reset timer on unmount
  useEffect(() => {
    return () => {
      if (coachResetRef.current) clearTimeout(coachResetRef.current);
    };
  }, []);

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
    setCustomCoachStatus('idle');
    setCurrentCustomPuzzle(null);
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

    // ── Browse mode: full-height path map + Custom Puzzles button ─────────
    // ── Solve mode: full-height Coach panel ───────────────────────────────
    return (
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait" initial={false}>
          {panelMode === 'browse' ? (
            <motion.div
              key="browse"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="absolute inset-0 flex flex-col gap-4"
            >
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
                  className="btn-gold-outline w-full flex items-center justify-center gap-2 px-4.5 py-3.5 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all duration-300 cursor-pointer bg-brand-surface border border-brand-accent/35 text-brand-accent hover:border-brand-accent/60 hover:-translate-y-0.5"
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
            </motion.div>
          ) : (
            <motion.div
              key="solve"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <PuzzleCoach
                selectedNode={selectedNode}
                status={coachStatus}
                onBackToMap={handleBackToMap}
              />
            </motion.div>
          )}
        </AnimatePresence>
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
            className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-colors duration-200 font-sans text-sm font-semibold cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Home</span>
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
                onStatusChange={handleCustomStatusChange}
                onPuzzleChange={setCurrentCustomPuzzle}
              />
            </div>

            <div className="lg:col-span-5 flex flex-col">
              <CustomPuzzleCoach
                puzzle={currentCustomPuzzle}
                status={customCoachStatus}
                onExit={handleExitCustomSession}
              />
            </div>
          </div>
        ) : isDesktop ? (
          /* ── DESKTOP VIEW (only mounted when isDesktop is true) ──────────── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
            <div className="lg:col-span-7 flex flex-col items-center w-full space-y-6">

              {/* ── Header card — changes based on whether a puzzle is active ── */}
              <div className="w-full bg-brand-surface/70 backdrop-blur-xl border border-brand-border rounded-2xl p-5 text-left relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {selectedNode ? (
                  // Puzzle active — show level info
                  <>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-display lining-nums font-semibold text-brand-text tracking-wide">
                          {`Level ${selectedNode.levelNumber}: ${selectedNode.title || 'Mate in 1'}`}
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400">
                          Rating {safeChessPuzzle.rating}
                        </span>
                      </div>
                      <p className="text-xs text-brand-secondary font-sans mt-0.5">
                        {selectedNode.description || 'Solve tactics to train your checkmate vision.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleNextPuzzle}
                      disabled={!isNextEnabled}
                      className="px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-500"
                    >
                      <span>Next Level</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  // No puzzle selected — invite the user to pick one
                  <div>
                    <h1 className="text-xl sm:text-2xl font-display font-semibold text-brand-text tracking-wide">
                      Tactics Trainer
                    </h1>
                    <p className="text-xs text-brand-secondary font-sans mt-0.5">
                      Select a level from the map to begin solving.
                    </p>
                  </div>
                )}
              </div>

              {/* ── Board area ── */}
              <div className="flex justify-center w-full">
                {selectedNode ? (
                  // Active puzzle — full interactive PuzzleBoard
                  <PuzzleBoard
                    boardId="desktop-puzzle-board"
                    puzzle={safeChessPuzzle}
                    puzzleNumber={selectedNode.levelNumber}
                    onSolved={handleSolved}
                    onFailed={handleFailed}
                    onNextPuzzle={handleNextPuzzle}
                    isNextDisabled={!isNextEnabled}
                  />
                ) : (
                  // No puzzle selected — static starting position, no interaction
                  <div className="flex flex-col items-center gap-1 sm:gap-2 w-full flex-1 min-h-0">
                    <div
                      className="relative aspect-square border border-[rgba(212,175,110,0.40)] overflow-hidden bg-brand-surface"
                      style={{ transform: 'translateZ(0)', height: '100%', maxHeight: '100%', maxWidth: '100%' }}
                    >
                      <ThemedChessboard
                        options={{
                          position: STARTING_FEN,
                          boardOrientation: 'white',
                          showNotation: false,
                          allowDragging: false,
                          boardStyle: { borderRadius: '0px' },
                        }}
                      />
                    </div>
                    <div className="h-8 flex items-center justify-center">
                      <span className="font-mono uppercase tracking-wider text-xs font-semibold text-brand-secondary flex items-center gap-1.5 border border-brand-border/60 bg-brand-surface px-3 py-1 rounded-full">
                        Pick a level from the map →
                      </span>
                    </div>
                  </div>
                )}
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
                          className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back to Pathway</span>
                        </button>
                      </div>

                      <div className="w-full bg-brand-surface/70 backdrop-blur-xl border border-brand-border rounded-2xl p-4 text-left relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                          className="px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-500"
                        >
                          <span>Next Level</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <PuzzleCoach
                        selectedNode={selectedNode}
                        status={coachStatus}
                        onBackToMap={handleReturnToPathway}
                        compact
                      />

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
                          className="btn-gold-outline w-full flex items-center justify-center gap-2 px-4.5 py-3.5 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all duration-300 cursor-pointer bg-brand-surface border border-brand-accent/35 text-brand-accent hover:border-brand-accent/60 hover:-translate-y-0.5"
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