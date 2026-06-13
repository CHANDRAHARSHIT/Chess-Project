import { useState, useEffect, useRef, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useStockfish } from '../hooks/useStockfish';
import { parseUciMove, getGameOverReason } from '../utils/chessHelpers';
import { DIFFICULTY_CONFIGS, type DifficultyLevel } from '../types/chess';
import { RotateCcw, Sparkles, AlertCircle, ArrowRightLeft, Info } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

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
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(3);
  const [showAnalysisHint, setShowAnalysisHint] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);

  const {
    evaluation,
    bestMove,
    isThinking,
    engineDepth,
    getEngineMove,
    analyzePosition,
    stopSearch,
  } = useStockfish();

  // Move history container — scroll inside the box, never the page
  const moveHistoryContainerRef = useRef<HTMLDivElement>(null);

  // ScrollTrigger reveal refs
  const headerRef    = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  useScrollReveal(headerRef    as React.RefObject<Element | null>, { y: 50, duration: 0.8 });
  useScrollReveal(dashboardRef as React.RefObject<Element | null>, { y: 60, duration: 0.9, delay: 0.1 });

  // Sync game-over state after every FEN change
  useEffect(() => {
    setGameOverReason(getGameOverReason(gameRef.current));
  }, [gameFen]);

  // Scroll only inside the move history container
  useEffect(() => {
    const container = moveHistoryContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [gameFen]);

  // AI move trigger — fires when it's the engine's turn
  useEffect(() => {
    const game = gameRef.current;
    if (game.isGameOver()) return;
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
  }, [gameFen, playerColor, difficulty, getEngineMove]);

  // Piece drop handler — called by react-chessboard
  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string | null): boolean => {
      const game = gameRef.current;
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
          setShowAnalysisHint(false);
          return true;
        }
      } catch {
        // illegal move — no-op
      }
      return false;
    },
    [playerColor]
  );

  // Reset — load a fresh game into the ref without replacing the ref itself
  const handleReset = useCallback(() => {
    stopSearch();
    gameRef.current.reset();           // mutate in-place → Chessboard stays mounted
    setGameFen(gameRef.current.fen()); // trigger re-render with starting position
    setShowAnalysisHint(false);
    setGameOverReason(null);
  }, [stopSearch]);

  const handleFlip = useCallback(() => {
    setPlayerColor((prev) => (prev === 'w' ? 'b' : 'w'));
  }, []);

  const handleAnalyze = useCallback(() => {
    setShowAnalysisHint(true);
    analyzePosition(gameRef.current.fen());
  }, [analyzePosition]);

  // Eval bar
  let evalPercent = 50;
  let evalLabel = '0.0';
  if (evaluation) {
    if (evaluation.type === 'cp') {
      const val = evaluation.value;
      const clamped = Math.max(-8, Math.min(8, val));
      evalPercent = ((clamped + 8) / 16) * 100;
      evalLabel = val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
    } else {
      const val = evaluation.value;
      evalPercent = val > 0 ? 95 : 5;
      evalLabel = `M${Math.abs(val)}`;
    }
  }

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
    // Yellow highlight for last move — classic chess-site style
    customSquareStyles[last.from] = {
      backgroundColor: 'rgba(255, 255, 0, 0.4)',
    };
    customSquareStyles[last.to] = {
      backgroundColor: 'rgba(255, 255, 0, 0.4)',
    };
  }
  if (showAnalysisHint && bestMove) {
    const { from, to } = parseUciMove(bestMove);
    // Green highlight for engine suggestion
    customSquareStyles[from] = {
      backgroundColor: 'rgba(0, 200, 100, 0.45)',
      boxShadow: 'inset 0 0 0 3px rgba(0, 180, 80, 0.9)',
    };
    customSquareStyles[to] = {
      backgroundColor: 'rgba(0, 200, 100, 0.45)',
      boxShadow: 'inset 0 0 0 3px rgba(0, 180, 80, 0.9)',
    };
  }

  const currentConfig = DIFFICULTY_CONFIGS[difficulty];
  const currentTurn = gameRef.current.turn();

  return (
    <section id="interactive-demo" className="py-20 md:py-28 bg-brand-bg relative overflow-hidden">
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Title */}
        <div
          ref={headerRef}
          className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          style={{ opacity: 0 }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
            <span className="font-sans font-medium text-xs text-brand-accent tracking-wide uppercase">
              Live Product Demonstration
            </span>
          </div>
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            Interactive Platform Demo
          </h2>
          <p className="font-sans text-brand-secondary text-base leading-relaxed">
            Test the white-label custom game board. Challenge the integrated chess engine, check realtime evaluations,
            and see how academies customize their layouts.
          </p>
        </div>

        {/* Dashboard */}
        <div
          ref={dashboardRef}
          className="bg-brand-surface border border-brand-border rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto"
          style={{ opacity: 0 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

            {/* ── Col 1: Eval Bar ─────────────────────────────── */}
            <div className="lg:col-span-1 flex lg:flex-col items-center justify-between gap-3 h-10 lg:h-auto min-h-[40px] lg:min-h-[460px]">
              <div className="relative w-full lg:w-7 flex-1 h-3 lg:h-full bg-neutral-800 rounded-full overflow-hidden border border-brand-border flex items-end">
                <div
                  className="bg-slate-200 w-full transition-all duration-500 ease-out"
                  style={{ height: `${evalPercent}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span
                    className={`font-mono font-bold text-[10px] px-1 py-0.5 rounded shadow ${
                      evalPercent > 50 ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-900'
                    }`}
                  >
                    {evalLabel}
                  </span>
                </div>
              </div>
              {/* EVAL label removed */}
            </div>

            {/* ── Col 2: Chessboard ───────────────────────────── */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="aspect-square w-full rounded-lg overflow-hidden shadow-xl border border-brand-border relative">

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
                      onClick={handleReset}
                      className="flex items-center gap-2 px-5 py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-lg text-sm font-semibold transition-colors duration-200"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Play Again
                    </button>
                  </div>
                )}

                {/* react-chessboard — classic brown/beige look, stays mounted, never remounts */}
                <Chessboard
                  options={{
                    position: gameFen,
                    onPieceDrop: ({ sourceSquare, targetSquare }) =>
                      onDrop(sourceSquare, targetSquare),
                    boardOrientation: playerColor === 'w' ? 'white' : 'black',
                    squareStyles: customSquareStyles,
                    darkSquareStyle: { backgroundColor: '#b58863' },
                    lightSquareStyle: { backgroundColor: '#f0d9b5' },
                    boardStyle: { borderRadius: '4px' },
                  }}
                />
              </div>

              {/* Turn indicator — Engine Status removed */}
              <div className="mt-4 flex items-center gap-2 text-xs text-brand-secondary px-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full border border-brand-border ${
                    currentTurn === 'w' ? 'bg-white' : 'bg-neutral-800'
                  }`}
                />
                <span>
                  {currentTurn === 'w' ? "White's turn" : "Black's turn"}
                  {isThinking && (
                    <span className="text-brand-accent animate-pulse ml-1.5 font-medium">
                      (AI Thinking...)
                    </span>
                  )}
                  {engineDepth > 0 && (
                    <span className="ml-1.5 text-brand-secondary/60">(d:{engineDepth})</span>
                  )}
                </span>
              </div>
            </div>

            {/* ── Col 3: Control Panel ────────────────────────── */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-6">

              {/* Controls — SETUP & SETTINGS heading removed, icons kept */}
              <div className="space-y-4">
                <div className="flex items-center justify-end border-b border-brand-border/60 pb-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleFlip}
                      title="Flip Board"
                      className="p-1.5 rounded hover:bg-white/5 border border-transparent hover:border-brand-border text-brand-secondary hover:text-white transition-all"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleReset}
                      title="Reset Board"
                      className="p-1.5 rounded hover:bg-white/5 border border-transparent hover:border-brand-border text-brand-secondary hover:text-white transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Play As */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-sans text-brand-secondary">Play As</label>
                  <div className="grid grid-cols-2 gap-2 bg-brand-bg p-1 rounded-lg border border-brand-border">
                    {(['w', 'b'] as const).map((color) => (
                      <button
                        key={color}
                        onClick={() => setPlayerColor(color)}
                        className={`py-1.5 rounded text-xs font-semibold font-sans transition-all duration-200 ${
                          playerColor === color
                            ? 'bg-brand-surface text-white shadow-sm border border-brand-border'
                            : 'text-brand-secondary hover:text-white'
                        }`}
                      >
                        {color === 'w' ? 'White' : 'Black'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty — "Stockfish" removed, rating shown */}
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
                          setShowAnalysisHint(false);
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
                  <p className="text-[10px] text-brand-secondary mt-1 tracking-wide leading-normal">
                    {currentConfig.description}
                  </p>
                </div>
              </div>

              {/* Move History — scrolls inside container only, never page */}
              <div className="flex-1 flex flex-col justify-start min-h-[140px] text-left">
                <label className="text-xs font-sans text-brand-secondary mb-2 block">Move History</label>
                <div
                  ref={moveHistoryContainerRef}
                  className="flex-1 overflow-y-auto max-h-44 border border-brand-border/60 rounded-lg p-3 bg-brand-bg/40 font-mono text-sm space-y-1"
                >
                  {movePairs.length === 0 ? (
                    <div className="text-brand-secondary/60 text-xs text-center py-10">
                      No moves registered. Make a move on the board.
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

              {/* Analyze */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleAnalyze}
                  disabled={!!gameOverReason || isThinking}
                  className="w-full flex items-center justify-center gap-2 font-sans font-semibold text-sm bg-brand-surface hover:bg-brand-surface/80 border border-brand-border hover:border-brand-accent/50 text-white py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Sparkles className="w-4 h-4 text-brand-accent" />
                  Analyze Position
                </button>

                {showAnalysisHint && (
                  <div className="p-3 bg-brand-bg rounded-lg border border-brand-accent/25 text-left text-xs text-brand-secondary">
                    <div className="flex items-center gap-1.5 mb-1.5 text-white font-semibold">
                      <Info className="w-3.5 h-3.5 text-brand-accent" />
                      <span>Engine Analysis</span>
                    </div>
                    {isThinking ? (
                      <span className="text-[11px] animate-pulse">Running engine search...</span>
                    ) : bestMove ? (
                      <div className="space-y-1">
                        <p className="text-[11px]">
                          Best move:{' '}
                          <span className="font-mono text-white bg-white/5 border border-brand-border px-1 py-0.5 rounded font-bold">
                            {bestMove}
                          </span>
                        </p>
                        <p className="text-[10px] text-brand-secondary/80">
                          Recommended squares highlighted on board.
                        </p>
                      </div>
                    ) : (
                      <span className="text-[11px]">Calculating...</span>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
