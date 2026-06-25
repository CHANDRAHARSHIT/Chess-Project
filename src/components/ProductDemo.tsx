import { useState, useEffect, useRef, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useStockfish } from '../hooks/useStockfish';
import { parseUciMove, getGameOverReason } from '../utils/chessHelpers';
import { generateChess960FEN } from '../utils/chess960';
import { EditPositionModal } from './EditPositionModal';
import { EvaluationBar } from './EvaluationBar';
import { validateEditorPosition, type EditorPositionState } from '../utils/positionEditor';
import { DIFFICULTY_CONFIGS, type DifficultyLevel } from '../types/chess';
import {
  RotateCcw,
  Lightbulb,
  AlertCircle,
  CornerUpLeft,
  Shuffle,
  Pencil,
  MoreHorizontal,
} from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useButtonGlow } from '../hooks/useButtonGlow';

// ── Board colours ─────────────────────────────────────────────────────────────
const BOARD_DARK  = '#769656';   // Tournament green
const BOARD_LIGHT = '#EEEED2';   // Off-white / cream

// Set false to hide coordinates; toggle easily here.
const SHOW_COORDINATES = false;

export default function ProductDemo() {
  // ─── ROOT CAUSE OF SCROLL BUG ─────────────────────────────────────────────
  // Previously: game was in useState → setGame() during reset caused React to
  // unmount+remount the Chessboard. react-chessboard internally calls focus()
  // on mount, which triggers browser scroll-into-view behavior.
  //
  // FIX: keep game in a useRef so the Chess instance is mutated in place.
  // setGameFen() only triggers a re-render of FEN-dependent UI, not a remount
  // of the Chessboard component itself (same DOM node, no focus side-effects).
  // ─────────────────────────────────────────────────────────────────────────
  const gameRef = useRef(new Chess());
  const [gameFen, setGameFen] = useState(() => gameRef.current.fen());

  // playerColor = the color the human plays (affects who makes moves)
  // boardOrientation = purely visual board flip (does NOT affect turn logic)
  // @ts-ignore
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');

  const [difficulty, setDifficulty] = useState<DifficultyLevel>(3);
  const [showHint, setShowHint] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playAgainGlowRef = useButtonGlow<HTMLButtonElement>();

  const {
    evaluation,
    bestMove,
    isThinking,
    getEngineMove,
    analyzePosition,
    stopSearch,
    resetEvaluation,
  } = useStockfish();

  // Move history container — scroll inside the box, never the page
  const moveHistoryContainerRef = useRef<HTMLDivElement>(null);

  // ── Layout measurements for exact sizing alignment ───────────────────────
  const [boardHeight, setBoardHeight] = useState<number>(0);
  const [controlsHeight, setControlsHeight] = useState<number>(0);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  // Progressive eval stabilization — separate displayed eval from raw eval
  // Start at 0.0 (never -0.0) for initial position
  const [displayEval, setDisplayEval] = useState<{ type: 'cp' | 'mate'; value: number } | null>({ type: 'cp', value: 0 });
  const evalTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const boardContainerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      if (boardContainerRef.current) {
        setBoardHeight(boardContainerRef.current.getBoundingClientRect().height);
      }
      if (controlsRef.current) {
        setControlsHeight(controlsRef.current.getBoundingClientRect().height);
      }
      setIsDesktop(window.innerWidth >= 1024);
    };

    measure();

    const resizeObserver = new ResizeObserver(() => {
      measure();
    });

    if (boardContainerRef.current) {
      resizeObserver.observe(boardContainerRef.current);
    }
    if (controlsRef.current) {
      resizeObserver.observe(controlsRef.current);
    }

    window.addEventListener('resize', measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // ScrollTrigger reveal ref for the dashboard
  const dashboardRef = useRef<HTMLDivElement>(null);
  useScrollReveal(dashboardRef as React.RefObject<Element | null>, { y: 60, duration: 0.9, delay: 0.1 });

  // Sync game-over state after every FEN change
  useEffect(() => {
    setGameOverReason(getGameOverReason(gameRef.current));
  }, [gameFen]);

  // Progressive eval stabilization — update display eval at 1s, 2s, 3s, 4s, 5s after each change
  useEffect(() => {
    // Clear existing scheduled updates
    evalTimeoutsRef.current.forEach(t => clearTimeout(t));
    evalTimeoutsRef.current = [];

    if (!evaluation) return;

    // Schedule delayed snapshots — each one captures evaluation at that moment
    // Do NOT set immediately; let Stockfish stabilize before showing values.
    const delays = [1000, 2000, 3000, 4000, 5000];
    delays.forEach(delay => {
      const capturedEval = { type: evaluation.type, value: evaluation.value };
      const t = setTimeout(() => {
        setDisplayEval({ type: capturedEval.type, value: capturedEval.value });
      }, delay);
      evalTimeoutsRef.current.push(t);
    });

    return () => {
      evalTimeoutsRef.current.forEach(t => clearTimeout(t));
    };
  }, [evaluation]);

  // Scroll only inside the move history container
  useEffect(() => {
    const container = moveHistoryContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [gameFen]);

  // Close More menu on outside click
  useEffect(() => {
    if (!showMoreMenu) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(e.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showMoreMenu]);

  // AI move trigger — fires when it's the engine's turn
  useEffect(() => {
    const game = gameRef.current;
    if (game.isGameOver()) return;
    if (isEditMode) return;
    if (game.turn() === playerColor) return; // it's the human's turn

    const timer = setTimeout(() => {
      getEngineMove(game.fen(), difficulty, (bestMoveStr) => {
        const { from, to, promotion } = parseUciMove(bestMoveStr);
        try {
          gameRef.current.move({ from, to, promotion: promotion || 'q' });
          setGameFen(gameRef.current.fen());
        } catch (e) {
          console.error('AI tried to make invalid move:', bestMoveStr, e);
        }
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [gameFen, playerColor, difficulty, getEngineMove, isEditMode]);

  // Auto-dismiss hint after 4 seconds once bestMove arrives
  useEffect(() => {
    if (showHint && bestMove) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => {
        setShowHint(false);
      }, 4000);
    }
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [showHint, bestMove]);

  // Piece drop handler — called by react-chessboard
  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string | null): boolean => {
      const game = gameRef.current;
      if (isEditMode) return false;
      if (game.isGameOver()) return false;
      if (game.turn() !== playerColor) return false;
      if (!targetSquare) return false;

      try {
        const move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q',
        });
        if (move) {
          setGameFen(game.fen());
          setShowHint(false); // dismiss hint on move
          if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
          return true;
        }
      } catch {
        // illegal move — no-op
      }
      return false;
    },
    [isEditMode, playerColor]
  );

  // Undo — take back the last TWO half-moves (human + engine)
  const handleUndo = useCallback(() => {
    const game = gameRef.current;
    const history = game.history();
    if (history.length === 0) return;
    // Undo engine move + human move (2 half-moves), or just 1 if only 1 exists
    game.undo();
    if (game.history().length > 0 && game.turn() !== playerColor) {
      game.undo();
    }
    setGameFen(game.fen());
    setShowHint(false);
    stopSearch();
  }, [playerColor, stopSearch]);

  // Hint — ask engine for best move and highlight squares (no auto-play)
  const handleHint = useCallback(() => {
    setShowHint(true);
    analyzePosition(gameRef.current.fen());
  }, [analyzePosition]);

  // Reset — load a fresh game into the ref without replacing the ref itself
  const loadFreshGame = useCallback((fen?: string) => {
    stopSearch();
    const freshGame = new Chess();

    if (fen) {
      freshGame.load(fen);
    }

    gameRef.current = freshGame;
    setGameFen(freshGame.fen());
    setShowHint(false);
    setGameOverReason(null);
    resetEvaluation();
    // Reset display eval to 0.0 so bar shows correct value on new game
    setDisplayEval({ type: 'cp', value: 0 });
    evalTimeoutsRef.current.forEach(t => clearTimeout(t));
    evalTimeoutsRef.current = [];
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
  }, [stopSearch, resetEvaluation]);

  const handleReset = useCallback(() => {
    loadFreshGame();
  }, [loadFreshGame]);

  const handleChess960 = useCallback(() => {
    loadFreshGame(generateChess960FEN());
  }, [loadFreshGame]);

  const handleOpenEditor = useCallback(() => {
    stopSearch();
    setShowHint(false);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    setIsEditMode(true);
  }, [stopSearch]);

  const handleCancelEditor = useCallback(() => {
    setIsEditMode(false);
  }, []);

  const handleApplyEditorPosition = useCallback((fen: string) => {
    loadFreshGame(fen);
    setIsEditMode(false);
  }, [loadFreshGame]);

  const handleValidateEditorPosition = useCallback((state: EditorPositionState) => {
    return validateEditorPosition(state);
  }, []);

  /*
    stopSearch();
    gameRef.current.reset();           // mutate in-place → Chessboard stays mounted
    setGameFen(gameRef.current.fen()); // trigger re-render with starting position
    setShowHint(false);
    setGameOverReason(null);
    resetEvaluation();                 // ← fix: clear eval bar + bestMove
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
  */

  // Switch Side — ONLY flips board orientation, never triggers engine move
  // @ts-ignore
  const handleSwitchSide = useCallback(() => {
    setBoardOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  }, []);

  // Move history — derived from the current game instance
  const history = gameRef.current.history({ verbose: true });
  const movePairs: { moveNumber: number; white: (typeof history)[0]; black: (typeof history)[0] | undefined }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  // Square highlights
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (history.length > 0) {
    const last = history[history.length - 1];
    customSquareStyles[last.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    customSquareStyles[last.to]   = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
  }
  if (showHint && bestMove) {
    const { from, to } = parseUciMove(bestMove);
    customSquareStyles[from] = {
      backgroundColor: 'rgba(0, 200, 100, 0.50)',
      boxShadow: 'inset 0 0 0 3px rgba(0, 180, 80, 0.95)',
    };
    customSquareStyles[to] = {
      backgroundColor: 'rgba(0, 200, 100, 0.50)',
      boxShadow: 'inset 0 0 0 3px rgba(0, 180, 80, 0.95)',
    };
  }

  const currentConfig = DIFFICULTY_CONFIGS[difficulty];
  const currentTurn = gameRef.current.turn();
  const canUndo = history.length > 0 && !gameOverReason;

  return (
    <section id="interactive-demo" className="py-12 md:py-16 bg-brand-bg relative overflow-hidden">
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Dashboard */}
        <div
          ref={dashboardRef}
          className="bg-brand-surface border border-brand-border rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto"
          style={{ opacity: 0 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-stretch">

            {/* ── Col 1: Eval Bar ──────────────────────────────────── */}
            <div
              className="lg:col-span-1 flex lg:flex-col items-center justify-center gap-0"
              style={{ alignSelf: 'stretch', padding: '0' }}
            >
              <EvaluationBar evaluation={displayEval} isDesktop={isDesktop} boardHeight={boardHeight} />
            </div>

            {/* ── Col 2: Chessboard ────────────────────────────────────────── */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div ref={boardContainerRef} className="aspect-square w-full shadow-xl border border-brand-border relative overflow-hidden" style={{ borderRadius: '4px' }}>

                {/* Game Over Overlay */}
                {gameOverReason && (
                  <div className="absolute inset-0 z-20 bg-brand-bg/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-bold text-white">Game Finished</h4>
                      <p className="text-sm text-brand-secondary mt-1">{gameOverReason}</p>
                    </div>
                    <button
                      ref={playAgainGlowRef}
                      onClick={handleReset}
                      className="flex items-center gap-2 px-5 py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-lg text-sm font-semibold transition-colors duration-200 btn-glow-container btn-glow-accent"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Play Again
                    </button>
                  </div>
                )}

                {/* react-chessboard — green/cream theme, stays mounted, never remounts */}
                <Chessboard
                  options={{
                    position: gameFen,
                    onPieceDrop: ({ sourceSquare, targetSquare }) =>
                      onDrop(sourceSquare, targetSquare),
                    boardOrientation: boardOrientation,
                    squareStyles: customSquareStyles,
                    darkSquareStyle:  { backgroundColor: BOARD_DARK },
                    lightSquareStyle: { backgroundColor: BOARD_LIGHT },
                    boardStyle: { borderRadius: '0px' },
                    showNotation: SHOW_COORDINATES,
                  }}
                />
              </div>

              {/* Turn indicator */}
              <div className="mt-3 flex items-center gap-2 text-xs text-brand-secondary px-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full border border-brand-border ${
                    currentTurn === 'w' ? 'bg-white' : 'bg-neutral-800'
                  }`}
                />
                <span>
                  {currentTurn === 'w' ? "White's Turn" : "Black's Turn"}
                  {isEditMode && (
                    <span className="text-brand-accent ml-1.5 font-medium">
                      (Edit Position Mode)
                    </span>
                  )}
                  {isThinking && (
                    <span className="text-brand-accent animate-pulse ml-1.5 font-medium">
                      (AI Thinking...)
                    </span>
                  )}
                </span>
                {showHint && bestMove && (
                  <span className="ml-auto text-emerald-400 font-medium flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    Hint active
                  </span>
                )}
              </div>
            </div>

            {/* ── Col 3: Control Panel ─────────────────────────────────────── */}
            <div className="lg:col-span-4 flex flex-col gap-10 lg:self-stretch">

              <div ref={controlsRef} className="flex flex-col gap-8">
                {/* ── Toolbar ───────────────────────────────────── */}
                <div className="grid grid-cols-4 gap-2">

                  {/* Undo */}
                  <button
                    onClick={handleUndo}
                    disabled={!canUndo || isThinking || isEditMode}
                    title="Undo last move"
                    className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-lg border border-brand-border bg-brand-bg hover:bg-white/5 hover:border-brand-accent/40 text-brand-secondary hover:text-white transition-all duration-200 disabled:opacity-40 group"
                    style={{ cursor: (!canUndo || isThinking || isEditMode) ? 'not-allowed' : 'pointer' }}
                  >
                    <CornerUpLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-medium font-sans tracking-wide">Undo</span>
                  </button>

                  {/* Hint */}
                  <button
                    onClick={handleHint}
                    disabled={!!gameOverReason || isThinking || isEditMode || game_is_human_turn(currentTurn, playerColor) === false}
                    title="Get a hint"
                    className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-lg border border-brand-border bg-brand-bg hover:bg-white/5 hover:border-brand-accent/40 text-brand-secondary hover:text-yellow-400 transition-all duration-200 disabled:opacity-40 group"
                    style={{ cursor: (!!gameOverReason || isThinking || isEditMode || !game_is_human_turn(currentTurn, playerColor)) ? 'not-allowed' : 'pointer' }}
                  >
                    <Lightbulb className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-medium font-sans tracking-wide">Hint</span>
                  </button>

                  {/* Reset */}
                  <button
                    onClick={handleReset}
                    disabled={isEditMode}
                    title="Reset game"
                    className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-lg border border-brand-border bg-brand-bg hover:bg-white/5 hover:border-red-500/40 text-brand-secondary hover:text-red-400 transition-all duration-200 disabled:opacity-40 group"
                    style={{ cursor: isEditMode ? 'not-allowed' : 'pointer' }}
                  >
                    <RotateCcw className="w-5 h-5 group-hover:rotate-[-45deg] transition-transform duration-300" />
                    <span className="text-[10px] font-medium font-sans tracking-wide">Reset</span>
                  </button>

                  {/* More — opens popup with Chess960 + Edit Position */}
                  <div className="relative">
                    <button
                      ref={moreButtonRef}
                      onClick={() => setShowMoreMenu(prev => !prev)}
                      title="More options"
                      className={`w-full flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-lg border transition-all duration-200 group cursor-pointer ${
                        showMoreMenu
                          ? 'border-brand-accent/60 bg-brand-accent/10 text-white'
                          : 'border-brand-border bg-brand-bg hover:bg-white/5 hover:border-brand-accent/40 text-brand-secondary hover:text-white'
                      }`}
                    >
                      <MoreHorizontal className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-medium font-sans tracking-wide">More</span>
                    </button>

                    {/* Popup menu */}
                    {showMoreMenu && (
                      <div
                        ref={moreMenuRef}
                        className="absolute right-0 top-full mt-1.5 z-50 min-w-[160px] animate-fade-in"
                        style={{
                          background: 'rgba(17, 24, 39, 0.97)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          borderRadius: '10px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(99,102,241,0.1)',
                          backdropFilter: 'blur(12px)',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Chess960 */}
                        <button
                          onClick={() => { handleChess960(); setShowMoreMenu(false); }}
                          disabled={isEditMode}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-brand-secondary hover:text-white hover:bg-white/10 transition-all duration-150 disabled:opacity-40 group cursor-pointer"
                          style={{ cursor: isEditMode ? 'not-allowed' : 'pointer' }}
                        >
                          <Shuffle className="w-4 h-4 text-brand-accent group-hover:scale-110 transition-transform" />
                          <span className="font-sans font-medium">Chess960</span>
                        </button>

                        {/* Divider */}
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 12px' }} />

                        {/* Edit Position */}
                        <button
                          onClick={() => { handleOpenEditor(); setShowMoreMenu(false); }}
                          disabled={isThinking}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-brand-secondary hover:text-white hover:bg-white/10 transition-all duration-150 disabled:opacity-40 group cursor-pointer"
                          style={{ cursor: isThinking ? 'not-allowed' : 'pointer' }}
                        >
                          <Pencil className="w-4 h-4 text-brand-accent group-hover:scale-110 transition-transform" />
                          <span className="font-sans font-medium">Edit Position</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>

                {/* ── Difficulty ───────────────────────────────────── */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-sans text-brand-secondary">Difficulty</label>
                    <span className="text-xs font-semibold text-brand-accent font-sans">
                      {currentConfig.name} ({currentConfig.rating})
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 bg-brand-bg p-1 rounded-lg border border-brand-border">
                    {([1, 2, 3, 4, 5] as DifficultyLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          setDifficulty(level);
                          setShowHint(false);
                        }}
                        title={`${DIFFICULTY_CONFIGS[level].name} (${DIFFICULTY_CONFIGS[level].rating})`}
                        className={`py-1 rounded text-xs font-mono transition-all duration-200 ${
                          difficulty === level
                            ? 'bg-brand-accent text-white shadow-sm font-bold'
                            : 'text-brand-secondary hover:bg-white/5'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Move History ──────────────────────────────────────────── */}
              <div
                className="flex flex-col text-left"
                style={{
                  height: isDesktop && boardHeight && controlsHeight
                    ? `${Math.max(120, boardHeight - controlsHeight - 20)}px`
                    : '220px'
                }}
              >
                <div
                  ref={moveHistoryContainerRef}
                  className="flex-1 overflow-y-auto border border-brand-border/60 rounded-lg p-3 bg-brand-bg/40 font-mono text-sm space-y-1 move-history-scroll"
                >
                  {movePairs.length === 0 ? (
                    <div className="text-brand-secondary/60 text-xs text-center py-10">
                      No moves yet. Make a move on the board.
                    </div>
                  ) : (
                    movePairs.map((pair) => (
                      <div
                        key={pair.moveNumber}
                        className="grid grid-cols-12 gap-1 py-1 px-2 rounded hover:bg-white/5 transition-colors"
                      >
                        <span className="col-span-2 text-brand-secondary/70">{pair.moveNumber}.</span>
                        <span className="col-span-5 text-white font-medium">{pair.white.san}</span>
                        <span className="col-span-5 text-brand-secondary font-medium">
                          {pair.black ? pair.black.san : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <EditPositionModal
        initialFen={gameFen}
        isOpen={isEditMode}
        boardOrientation={boardOrientation}
        onApply={handleApplyEditorPosition}
        onCancel={handleCancelEditor}
        onValidate={handleValidateEditorPosition}
      />
    </section>
  );
}

// Helper — is it currently the human player's turn?
function game_is_human_turn(currentTurn: 'w' | 'b', playerColor: 'w' | 'b') {
  return currentTurn === playerColor;
}
