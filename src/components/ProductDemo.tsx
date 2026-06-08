import { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useStockfish } from '../hooks/useStockfish';
import { parseUciMove, getGameOverReason } from '../utils/chessHelpers';
import { DIFFICULTY_CONFIGS, type DifficultyLevel } from '../types/chess';
import { RotateCcw, Sparkles, AlertCircle, ArrowRightLeft, Info } from 'lucide-react';

export default function ProductDemo() {
  // Initialize game states
  const [game, setGame] = useState(() => new Chess());
  const [gameFen, setGameFen] = useState(game.fen());
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(3);
  const [showAnalysisHint, setShowAnalysisHint] = useState<boolean>(false);

  const {
    evaluation,
    bestMove,
    isThinking,
    engineStatus,
    engineDepth,
    getEngineMove,
    analyzePosition,
    stopSearch
  } = useStockfish();

  // Scroll to bottom of move history ref
  const moveHistoryEndRef = useRef<HTMLDivElement>(null);

  // Parse moves list
  const history = game.history({ verbose: true });
  
  // Format pairs of moves
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  // Scroll move history to bottom
  useEffect(() => {
    moveHistoryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history.length]);

  // AI Move triggers
  useEffect(() => {
    if (game.isGameOver()) return;

    const currentTurn = game.turn();
    
    // If it's the engine's turn to play, trigger engine move
    if (currentTurn !== playerColor) {
      const timer = setTimeout(() => {
        getEngineMove(game.fen(), difficulty, (bestMoveStr) => {
          const { from, to, promotion } = parseUciMove(bestMoveStr);
          try {
            game.move({ from, to, promotion: promotion || 'q' });
            setGameFen(game.fen());
          } catch (e) {
            console.error("AI tried to make invalid move: ", bestMoveStr, e);
          }
        });
      }, 350); // slight lag to make AI move natural
      
      return () => clearTimeout(timer);
    }
  }, [gameFen, playerColor, difficulty, getEngineMove]);

  // Game over state check
  const gameOverReason = getGameOverReason(game);

  // Handle piece drop by user
  function onDrop(sourceSquare: string, targetSquare: string | null) {
    if (game.isGameOver()) return false;
    if (game.turn() !== playerColor) return false; // Not user's turn
    if (!targetSquare) return false;

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // auto-promote to queen for simple UX
      });

      if (move) {
        setGameFen(game.fen());
        setShowAnalysisHint(false); // Clear hint
        return true;
      }
    } catch (e) {
      // Invalid move
      return false;
    }
    return false;
  }

  // Restart game
  const handleReset = () => {
    stopSearch();
    const newGame = new Chess();
    setGame(newGame);
    setGameFen(newGame.fen());
    setShowAnalysisHint(false);
  };

  // Flip board side
  const handleFlip = () => {
    setPlayerColor((prev) => (prev === 'w' ? 'b' : 'w'));
  };

  // Request engine evaluation hint
  const handleAnalyze = () => {
    setShowAnalysisHint(true);
    analyzePosition(game.fen());
  };

  // Calculate Eval Bar layout parameters
  // Mid point is 50%, White winning pushes it towards 100%, Black winning pushes it towards 0%.
  let evalPercent = 50;
  let evalLabel = '0.0';
  
  if (evaluation) {
    if (evaluation.type === 'cp') {
      const val = evaluation.value;
      // Clamp between -8 and +8
      const clamped = Math.max(-8, Math.min(8, val));
      evalPercent = ((clamped + 8) / 16) * 100;
      evalLabel = val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
    } else {
      // Mate score
      const val = evaluation.value;
      evalPercent = val > 0 ? 95 : 5;
      evalLabel = `M${Math.abs(val)}`;
    }
  }

  // Create custom square highlights for board
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  
  // Highlight last move squares
  if (history.length > 0) {
    const lastMove = history[history.length - 1];
    customSquareStyles[lastMove.from] = {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.15)',
    };
    customSquareStyles[lastMove.to] = {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.15)',
    };
  }

  // Highlight engine's suggested move if showAnalysisHint is enabled
  if (showAnalysisHint && bestMove) {
    const { from, to } = parseUciMove(bestMove);
    customSquareStyles[from] = {
      backgroundColor: 'rgba(99, 102, 241, 0.15)',
      boxShadow: 'inset 0 0 0 3px rgba(99, 102, 241, 0.7)',
    };
    customSquareStyles[to] = {
      backgroundColor: 'rgba(99, 102, 241, 0.15)',
      boxShadow: 'inset 0 0 0 3px rgba(99, 102, 241, 0.7)',
    };
  }

  return (
    <section id="interactive-demo" className="py-20 md:py-28 bg-brand-bg relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
            <span className="font-sans font-medium text-xs text-brand-accent tracking-wide uppercase">
              Section 3: Live Product Demonstration
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

        {/* Dashboard Grid Container */}
        <div className="bg-brand-surface border border-brand-border rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* COLUMN 1: Evaluation Bar (Desktop vertical, mobile horizontal) */}
            <div className="lg:col-span-1 flex lg:flex-col items-center justify-between gap-3 h-10 lg:h-auto min-h-[40px] lg:min-h-[460px]">
              
              {/* Vertical bar on Desktop, horizontal on mobile */}
              <div className="relative w-full lg:w-7 flex-1 h-3 lg:h-full bg-neutral-800 rounded-full overflow-hidden border border-brand-border flex items-end">
                {/* White advantage fills from bottom */}
                <div 
                  className="bg-slate-200 w-full transition-all duration-500 ease-out"
                  style={{ height: `${evalPercent}%` }}
                />
                
                {/* Floating Centipawn label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className={`font-mono font-bold text-[10px] px-1 py-0.5 rounded shadow ${
                    evalPercent > 50 ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-900'
                  }`}>
                    {evalLabel}
                  </span>
                </div>
              </div>
              
              <span className="hidden lg:block text-[10px] font-mono text-brand-secondary uppercase tracking-widest text-center">
                Eval
              </span>
            </div>

            {/* COLUMN 2: Chessboard View */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="aspect-square w-full rounded-lg overflow-hidden shadow-xl border border-brand-border relative bg-[#1B2235]">
                
                {/* Game Over Panel Overlay */}
                {gameOverReason && (
                  <div className="absolute inset-0 z-20 bg-brand-bg/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in duration-300">
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

                <Chessboard 
                  options={{
                    position: gameFen,
                    onPieceDrop: ({ sourceSquare, targetSquare }) => {
                      return onDrop(sourceSquare, targetSquare);
                    },
                    boardOrientation: playerColor === 'w' ? 'white' : 'black',
                    squareStyles: customSquareStyles,
                    darkSquareStyle: { backgroundColor: '#1E293B' },
                    lightSquareStyle: { backgroundColor: '#384252' },
                    boardStyle: {
                      borderRadius: '4px',
                    }
                  }}
                />
              </div>
              
              {/* Bottom indicators */}
              <div className="mt-4 flex items-center justify-between text-xs text-brand-secondary px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full border border-brand-border ${
                    game.turn() === 'w' ? 'bg-white' : 'bg-neutral-800'
                  }`} />
                  <span>
                    {game.turn() === 'w' ? "White's turn" : "Black's turn"} 
                    {isThinking && <span className="text-brand-accent animate-pulse ml-1.5 font-medium">(AI Thinking...)</span>}
                  </span>
                </div>
                
                <span className="font-mono text-[10px]">
                  Engine Status: {engineStatus === 'thinking' ? 'Analyzing' : engineStatus === 'analyzing' ? 'Full Scan' : 'Ready'}
                  {engineDepth > 0 && ` (d:${engineDepth})`}
                </span>
              </div>
            </div>

            {/* COLUMN 3: Game Control Panel */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
              
              {/* Top Controls Box */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
                  <span className="font-sans font-bold text-sm text-white tracking-wide uppercase">
                    Setup & Settings
                  </span>
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

                {/* Color Selector */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-sans text-brand-secondary">Play As</label>
                  <div className="grid grid-cols-2 gap-2 bg-brand-bg p-1 rounded-lg border border-brand-border">
                    <button
                      onClick={() => setPlayerColor('w')}
                      className={`py-1.5 rounded text-xs font-semibold font-sans transition-all duration-200 ${
                        playerColor === 'w' 
                          ? 'bg-brand-surface text-white shadow-sm border border-brand-border' 
                          : 'text-brand-secondary hover:text-white'
                      }`}
                    >
                      White (Player)
                    </button>
                    <button
                      onClick={() => setPlayerColor('b')}
                      className={`py-1.5 rounded text-xs font-semibold font-sans transition-all duration-200 ${
                        playerColor === 'b' 
                          ? 'bg-brand-surface text-white shadow-sm border border-brand-border' 
                          : 'text-brand-secondary hover:text-white'
                      }`}
                    >
                      Black (Stockfish)
                    </button>
                  </div>
                </div>

                {/* Difficulty Selector */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-sans text-brand-secondary">Stockfish Difficulty</label>
                    <span className="text-xs font-semibold text-brand-accent font-sans">
                      Lv {difficulty}: {DIFFICULTY_CONFIGS[difficulty].name}
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
                    {DIFFICULTY_CONFIGS[difficulty].description}
                  </p>
                </div>
              </div>

              {/* Move History Logger */}
              <div className="flex-1 flex flex-col justify-start min-h-[140px] text-left">
                <label className="text-xs font-sans text-brand-secondary mb-2 block">Move History</label>
                <div className="flex-1 overflow-y-auto max-h-44 border border-brand-border/60 rounded-lg p-3 bg-brand-bg/40 font-mono text-sm space-y-1">
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
                  <div ref={moveHistoryEndRef} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleAnalyze}
                  disabled={game.isGameOver() || isThinking}
                  className="w-full flex items-center justify-center gap-2 font-sans font-semibold text-sm bg-brand-surface hover:bg-brand-surface/80 border border-brand-border hover:border-brand-accent/50 text-white py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Sparkles className="w-4 h-4 text-brand-accent" />
                  Analyze Position
                </button>
                
                {/* Engine suggestion details */}
                {showAnalysisHint && (
                  <div className="p-3 bg-brand-bg rounded-lg border border-brand-accent/25 text-left text-xs text-brand-secondary animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-1.5 mb-1.5 text-white font-semibold">
                      <Info className="w-3.5 h-3.5 text-brand-accent" />
                      <span>Stockfish Analysis Hint</span>
                    </div>
                    {isThinking ? (
                      <span className="text-[11px] animate-pulse">Running engine search...</span>
                    ) : bestMove ? (
                      <div className="space-y-1">
                        <p className="text-[11px]">
                          Best move: <span className="font-mono text-white bg-white/5 border border-brand-border px-1 py-0.5 rounded font-bold">{bestMove}</span>
                        </p>
                        <p className="text-[10px] text-brand-secondary/80">
                          Recommended line shows highlighted squares on board.
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
