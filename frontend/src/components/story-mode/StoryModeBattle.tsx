/**
 * StoryModeBattle.tsx
 *
 * Full chess battle screen for story mode monster/boss encounters.
 * Merges the luxury UI of the Quick Game (ProductDemo) with Story Mode RPG elements.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chess } from "chess.js";
import { ThemedChessboard } from "../ThemedChessboard";
import { useStockfish } from "../../hooks/useStockfish";
import {
  parseUciMove,
  getGameOverReason,
  playMoveSound,
} from "../../utils/chessHelpers";
import { EvaluationBar } from "../EvaluationBar";
import { soundManager } from "../../utils/SoundManager";
import {
  MONSTER_PROFILES,
  type MonsterProfile,
} from "../../data/storyModeMapData";
import { DIFFICULTY_CONFIGS, type DifficultyLevel } from "../../types/chess";
import { EditPositionModal } from "../EditPositionModal";
import {
  validateEditorPosition,
  type EditorPositionState,
} from "../../utils/positionEditor";
import rollbar from "../../config/rollbar";
import {
  Swords,
  Trophy,
  Skull,
  RotateCcw,
  ArrowLeft,
  CornerUpLeft,
  Lightbulb,
  Eye,
  Hourglass,
  Clock,
  Plus,
  Minus,
} from "lucide-react";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { BoardCoordinates } from "../BoardCoordinates";
import { useStoryModeRun } from "./StoryModeContext";

interface StoryModeBattleProps {
  nodeId: number;
  difficulty: DifficultyLevel;
  onVictory: () => void;
  onDefeat?: () => void;
  onRetreat: () => void;
}

export default function StoryModeBattle({
  nodeId,
  difficulty,
  onVictory,
  onDefeat,
  onRetreat,
}: StoryModeBattleProps) {
  // ── Game state ────────────────────────────────────────────────────────────
  const { runState, useCharge, addCoins } = useStoryModeRun();
  
  const gameRef = useRef(new Chess());
  const [gameFen, setGameFen] = useState(() => gameRef.current.fen());
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Result tracking
  const [battleResult, setBattleResult] = useState<"playing" | "victory" | "defeat">("playing");

  // Eval Bar Charges
  const [evalMovesRemaining, setEvalMovesRemaining] = useState<number>(0);

  // Clocks
  const initialTime = useMemo(() => {
    switch (difficulty) {
      case 5: return 180; // 3 min
      case 4: return 300; // 5 min
      case 3: return 420; // 7 min
      case 2: return 480; // 8 min
      case 1:
      default: return 600; // 10 min
    }
  }, [difficulty]);
  const [playerTime, setPlayerTime] = useState<number>(initialTime);
  const [enemyTime, setEnemyTime] = useState<number>(initialTime);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Edit Position & Menus
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const timeMenuRef = useRef<HTMLDivElement>(null);
  const timeButtonRef = useRef<HTMLButtonElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  // Monster profile
  const monster: MonsterProfile = MONSTER_PROFILES[nodeId] ?? {
    name: "Unknown Foe",
    title: "Mysterious Challenger",
    rating: "???",
    icon: "♟",
  };

  // ── Layout measurements ───────────────────────────────────────────────────
  const [boardHeight, setBoardHeight] = useState<number>(0);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const boardContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      if (boardContainerRef.current) {
        setBoardHeight(boardContainerRef.current.getBoundingClientRect().height);
      }
      setIsDesktop(window.innerWidth >= 1024);
    };

    measure();
    const resizeObserver = new ResizeObserver(() => measure());
    if (boardContainerRef.current) {
      resizeObserver.observe(boardContainerRef.current);
    }
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // ── Scroll Reveal ─────────────────────────────────────────────────────────
  const dashboardRef = useRef<HTMLDivElement>(null);
  useScrollReveal(dashboardRef as React.RefObject<Element | null>, {
    y: 60,
    duration: 0.9,
    delay: 0.1,
  });

  // ── Stockfish ─────────────────────────────────────────────────────────────
  const {
    evaluation,
    bestMove,
    isThinking,
    getEngineMove,
    analyzePosition,
    stopSearch,
    resetEvaluation,
  } = useStockfish();

  // Progressive Eval Bar logic
  const [displayEval, setDisplayEval] = useState<{ type: "cp" | "mate"; value: number; } | null>({ type: "cp", value: 0 });
  const evalTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    evalTimeoutsRef.current.forEach((t) => clearTimeout(t));
    evalTimeoutsRef.current = [];

    if (!evaluation) return;

    const delays = [1000, 2000, 3000, 4000, 5000];
    delays.forEach((delay) => {
      const capturedEval = { type: evaluation.type, value: evaluation.value };
      const t = setTimeout(() => {
        setDisplayEval({ type: capturedEval.type, value: capturedEval.value });
      }, delay);
      evalTimeoutsRef.current.push(t);
    });

    return () => {
      evalTimeoutsRef.current.forEach((t) => clearTimeout(t));
    };
  }, [evaluation]);

  // Move history container
  const moveHistoryContainerRef = useRef<HTMLDivElement>(null);

  // ── Clock Ticking ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (battleResult !== "playing" || isEditMode || !!gameOverReason) return;

    const interval = setInterval(() => {
      const turn = gameRef.current.turn();
      if (turn === playerColor) {
        setPlayerTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameOverReason("timeout");
            setBattleResult("defeat");
            return 0;
          }
          return prev - 1;
        });
      } else {
        setEnemyTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameOverReason("timeout");
            setBattleResult("victory");
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [battleResult, isEditMode, playerColor, gameOverReason]);

  // ── Game-over detection ───────────────────────────────────────────────────
  useEffect(() => {
    const reason = getGameOverReason(gameRef.current);
    setGameOverReason(reason);

    if (reason) {
      soundManager.playGameEnd();
      const game = gameRef.current;
      if (game.isCheckmate()) {
        const aiLost = game.turn() !== playerColor;
        setBattleResult(aiLost ? "victory" : "defeat");
      } else {
        // Draws count as defeat in story mode
        setBattleResult("defeat");
      }
    }
  }, [gameFen, playerColor]);

  // ── AI move trigger ───────────────────────────────────────────────────────
  useEffect(() => {
    const game = gameRef.current;
    if (game.isGameOver()) return;
    if (isEditMode) return;
    if (game.turn() === playerColor) return;

    const timer = setTimeout(() => {
      getEngineMove(game.fen(), difficulty, (bestMoveStr) => {
        const { from, to, promotion } = parseUciMove(bestMoveStr);
        try {
          const move = gameRef.current.move({ from, to, promotion: promotion || "q" });
          if (move) {
            setGameFen(gameRef.current.fen());
            playMoveSound(gameRef.current, move.flags, !!move.captured);
          }
        } catch (e) {
          console.error("AI tried invalid move:", bestMoveStr, e);
          rollbar.error(e as Error, { context: "StoryModeBattle.applyEngineMove", bestMoveStr });
        }
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [gameFen, playerColor, difficulty, getEngineMove, isEditMode]);

  // Scroll move history
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
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showMoreMenu]);

  // Auto-dismiss hint
  useEffect(() => {
    if (showHint && bestMove) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => setShowHint(false), 4000);
    }
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [showHint, bestMove]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string | null): boolean => {
      const game = gameRef.current;
      if (isEditMode) return false;
      if (game.isGameOver()) return false;
      if (game.turn() !== playerColor) return false;
      if (!targetSquare) return false;

      try {
        const move = game.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
        if (move) {
          setGameFen(game.fen());
          setShowHint(false);
          setEvalMovesRemaining(prev => Math.max(0, prev - 1));
          if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
          playMoveSound(game, move.flags, !!move.captured);
          return true;
        }
      } catch {
        // illegal move
      }
      return false;
    },
    [isEditMode, playerColor]
  );

  const handleUndo = useCallback(() => {
    const game = gameRef.current;
    const history = game.history();
    if (history.length === 0) return;
    if (runState.undoCharges <= 0) return;

    const used = useCharge('undo');
    if (!used) return;

    game.undo();
    if (game.history().length > 0 && game.turn() !== playerColor) {
      game.undo();
    }
    setGameFen(game.fen());
    setShowHint(false);
    stopSearch();
    soundManager.playMove();
  }, [playerColor, stopSearch, runState.undoCharges, useCharge]);

  const handleHint = useCallback(() => {
    if (runState.hintCharges <= 0) return;
    const used = useCharge('hint');
    if (!used) return;

    setShowHint(true);
    analyzePosition(gameRef.current.fen(), runState.hintStrength);
  }, [analyzePosition, runState.hintCharges, runState.hintStrength, useCharge]);

  const handleActivateEval = useCallback(() => {
    if (runState.evalBarCharges <= 0) return;
    const used = useCharge('evalBar');
    if (!used) return;
    
    const moves = runState.evalBarTier === 'bronze' ? 5 : runState.evalBarTier === 'silver' ? 10 : Infinity;
    setEvalMovesRemaining(prev => prev + moves);
  }, [useCharge, runState.evalBarCharges, runState.evalBarTier]);

  const handleTimeAction = useCallback((action: 'increase_player' | 'decrease_enemy') => {
    if (runState.timeCharges <= 0) return;
    const used = useCharge('time');
    if (!used) return;

    if (action === 'increase_player') {
      setPlayerTime(prev => prev + Math.floor(initialTime * 0.1));
    } else {
      setEnemyTime(prev => Math.max(1, prev - Math.floor(initialTime * 0.1)));
    }
  }, [useCharge, runState.timeCharges]);

  const handleVictory = useCallback(() => {
    const baseCoins = difficulty === 5 ? 50 : difficulty >= 3 ? 30 : 15;
    addCoins(baseCoins);
    onVictory();
  }, [addCoins, difficulty, onVictory]);

  const loadFreshGame = useCallback(
    (fen?: string) => {
      stopSearch();
      const freshGame = new Chess();
      if (fen) freshGame.load(fen);
      gameRef.current = freshGame;
      setGameFen(freshGame.fen());
      setShowHint(false);
      setGameOverReason(null);
      setBattleResult("playing");
      setPlayerTime(initialTime);
      setEnemyTime(initialTime);
      resetEvaluation();
      setDisplayEval({ type: "cp", value: 0 });
      evalTimeoutsRef.current.forEach((t) => clearTimeout(t));
      evalTimeoutsRef.current = [];
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      soundManager.playGameStart();
    },
    [stopSearch, resetEvaluation]
  );

  const handleRetry = useCallback(() => {
    loadFreshGame();
  }, [loadFreshGame]);

  const handleApplyEditorPosition = useCallback(
    (fen: string) => {
      loadFreshGame(fen);
      setIsEditMode(false);
    },
    [loadFreshGame]
  );

  const handleSwitchSide = useCallback(() => {
    setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
    setPlayerColor((prev) => (prev === "w" ? "b" : "w"));
  }, []);

  const handleValidateEditorPosition = useCallback(
    (state: EditorPositionState) => validateEditorPosition(state),
    []
  );

  // ── Square Highlighting & Arrows ──────────────────────────────────────────
  const customArrows: [string, string][] = [];
  const customSquareStyles: Record<string, React.CSSProperties> = {};

  const history = gameRef.current.history({ verbose: true });
  if (history.length > 0) {
    const last = history[history.length - 1];
    customSquareStyles[last.from] = { backgroundColor: "rgba(255, 255, 0, 0.4)" };
    customSquareStyles[last.to] = { backgroundColor: "rgba(255, 255, 0, 0.4)" };
  }

  if (showHint && bestMove) {
    const { from, to } = parseUciMove(bestMove);
    customArrows.push([from, to]);
    customSquareStyles[from] = {
      backgroundColor: "rgba(0, 200, 100, 0.50)",
      boxShadow: "inset 0 0 0 3px rgba(0, 180, 80, 0.95)",
    };
    customSquareStyles[to] = {
      backgroundColor: "rgba(0, 200, 100, 0.50)",
      boxShadow: "inset 0 0 0 3px rgba(0, 180, 80, 0.95)",
    };
  }

  // ── Move History Pairs ────────────────────────────────────────────────────
  const movePairs: { num: number; white: (typeof history)[0]; black?: (typeof history)[0] }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  const currentTurn = gameRef.current.turn();
  const canUndo = history.length > 0 && !gameOverReason;
  const currentConfig = DIFFICULTY_CONFIGS[difficulty];

  // ── Start sound ───────────────────────────────────────────────────────────
  useEffect(() => {
    soundManager.playGameStart();
  }, []);

  return (
    <motion.div
      className="w-full flex flex-col items-center gap-6 py-4 px-2 sm:px-4 mb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-6xl mx-auto flex items-center justify-start px-2">
        <button
          onClick={onRetreat}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-brand-secondary hover:text-brand-text hover:bg-brand-surface border border-transparent hover:border-brand-border/40 transition-all text-xs font-mono cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retreat to Map
        </button>
      </div>

      {/* Monster header */}
      <motion.div
        className="flex flex-col items-center gap-2 text-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{monster.icon}</span>
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-text">
              {monster.name}
            </h2>
            <p className="text-xs font-mono text-brand-secondary">
              {monster.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Swords className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-mono text-red-400">
            Rating {monster.rating}
          </span>
          <span className="text-xs text-brand-secondary">•</span>
          <span className="text-xs font-mono text-brand-secondary">
            Difficulty {difficulty}/5
          </span>
        </div>
      </motion.div>

      {/* Dashboard (From ProductDemo) */}
      <div
        ref={dashboardRef}
        className="luxury-card rounded-sm shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-6xl mx-auto"
        style={{ opacity: 0 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-stretch">
          {/* ── Col 1: Eval Bar ────────────────────────────────────────── */}
          <div
            className="lg:col-span-1 flex lg:flex-col items-center lg:justify-start justify-center gap-0 relative"
            style={{ alignSelf: "stretch", padding: "0" }}
          >
            {evalMovesRemaining > 0 && (
              <>
                <EvaluationBar
                  evaluation={displayEval}
                  isDesktop={isDesktop}
                  boardHeight={boardHeight}
                />
                {evalMovesRemaining !== Infinity && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-[10px] text-white font-mono z-10 whitespace-nowrap">
                    {evalMovesRemaining} moves left
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Col 2: Chessboard ────────────────────────────────────────── */}
          <div className="lg:col-span-7 flex flex-col lg:justify-start justify-center">
            <div
              ref={boardContainerRef}
              className="aspect-square w-full shadow-xl border border-brand-border relative overflow-hidden"
              style={{ borderRadius: "4px", transform: "translateZ(0)" }}
            >
              <ThemedChessboard
                options={({
                  position: gameFen,
                  onPieceDrop: ({ sourceSquare, targetSquare }: any) =>
                    onDrop(sourceSquare, targetSquare),
                  boardOrientation,
                  squareStyles: customSquareStyles,
                  boardStyle: { borderRadius: "0px" },
                  showNotation: false,
                  arePiecesDraggable: battleResult === "playing" && !isEditMode,
                } as any)}
              />
              <BoardCoordinates boardOrientation={boardOrientation} />
            </div>

            {/* Turn indicator */}
            <div className="mt-3 flex items-center justify-between text-xs text-brand-secondary px-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full border border-brand-border ${
                    currentTurn === "w" ? "bg-white" : "bg-neutral-800"
                  }`}
                />
                <span>
                  {currentTurn === "w" ? "White's Turn" : "Black's Turn"}
                  {isEditMode && (
                    <span className="text-brand-accent ml-1.5 font-medium">
                      (Edit Position Mode)
                    </span>
                  )}
                  {isThinking && (
                    <span className="text-brand-accent animate-pulse ml-1.5 font-medium">
                      ({monster.name} is thinking...)
                    </span>
                  )}
                </span>
              </div>
              {showHint && bestMove && (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  Hint active
                </span>
              )}
            </div>
          </div>

          {/* ── Col 3: Control Panel ────────────────────────────────────────── */}
          <div
            className="lg:col-span-4 flex flex-col lg:gap-4 gap-6 lg:self-stretch"
            style={{ height: isDesktop && boardHeight ? `${boardHeight}px` : undefined }}
          >
            <div className="flex flex-col gap-3">
              {/* Clocks */}
              <div className="flex justify-between items-center bg-brand-bg/80 p-3 rounded-xl border border-brand-border/60 shadow-inner">
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-[10px] text-brand-secondary font-mono flex items-center gap-1 uppercase tracking-wider">
                    <Clock className="w-3 h-3" /> Enemy
                  </span>
                  <span className={`text-2xl font-mono font-bold tracking-tight ${enemyTime < 60 ? 'text-red-400 animate-pulse' : 'text-brand-text'}`}>
                    {formatTime(enemyTime)}
                  </span>
                </div>
                <div className="h-8 w-px bg-brand-border/50"></div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] text-brand-secondary font-mono flex items-center gap-1 uppercase tracking-wider">
                    You <Clock className="w-3 h-3" />
                  </span>
                  <span className={`text-2xl font-mono font-bold tracking-tight ${playerTime < 60 ? 'text-red-400 animate-pulse' : 'text-brand-text'}`}>
                    {formatTime(playerTime)}
                  </span>
                </div>
              </div>

              {/* Toolbar */}
              <div className="grid grid-cols-5 gap-1.5">
                <button
                  onClick={handleUndo}
                  disabled={!canUndo || isThinking || isEditMode || runState.undoCharges <= 0}
                  title="Undo last move"
                  className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border border-brand-border bg-brand-bg hover:bg-brand-text/5 hover:border-[rgba(212,175,110,0.4)] text-brand-secondary hover:text-brand-text transition-all duration-200 disabled:opacity-40 group cursor-pointer"
                  style={{ cursor: !canUndo || isThinking || isEditMode || runState.undoCharges <= 0 ? "not-allowed" : "pointer" }}
                >
                  <CornerUpLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-medium font-sans tracking-wide">Undo ({runState.undoCharges})</span>
                </button>

                <button
                  onClick={() => { soundManager.playButtonClick(); handleHint(); }}
                  disabled={!!gameOverReason || isThinking || isEditMode || currentTurn !== playerColor || runState.hintCharges <= 0}
                  title="Get a hint"
                  className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border border-brand-border bg-brand-bg hover:bg-brand-text/5 hover:border-[rgba(212,175,110,0.4)] text-brand-secondary hover:text-yellow-400 transition-all duration-200 disabled:opacity-40 group cursor-pointer"
                  style={{ cursor: !!gameOverReason || isThinking || isEditMode || currentTurn !== playerColor || runState.hintCharges <= 0 ? "not-allowed" : "pointer" }}
                >
                  <Lightbulb className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-medium font-sans tracking-wide">Hint ({runState.hintCharges})</span>
                </button>

                <button
                  onClick={handleRetry}
                  disabled={!canUndo || isEditMode}
                  title="Reset game"
                  className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border border-brand-border bg-brand-bg hover:bg-brand-text/5 hover:border-red-500/40 text-brand-secondary hover:text-red-400 transition-all duration-200 disabled:opacity-40 group cursor-pointer"
                  style={{ cursor: !canUndo || isEditMode ? "not-allowed" : "pointer" }}
                >
                  <RotateCcw className="w-5 h-5 group-hover:rotate-[-45deg] transition-transform duration-300" />
                  <span className="text-[10px] font-medium font-sans tracking-wide">Reset</span>
                </button>

                <button
                  onClick={() => { soundManager.playButtonClick(); handleActivateEval(); }}
                  disabled={runState.evalBarCharges <= 0 || isEditMode}
                  title="Activate Eval Bar"
                  className="w-full flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border border-brand-border bg-brand-bg hover:bg-brand-text/5 hover:border-emerald-500/40 text-brand-secondary hover:text-emerald-400 transition-all duration-200 disabled:opacity-40 group cursor-pointer"
                  style={{ cursor: runState.evalBarCharges <= 0 || isEditMode ? "not-allowed" : "pointer" }}
                >
                  <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-medium font-sans tracking-wide">Eval ({runState.evalBarCharges})</span>
                </button>

                <div className="relative">
                  <button
                    ref={timeButtonRef}
                    onClick={() => { soundManager.playButtonClick(); setShowTimeMenu((prev) => !prev); }}
                    disabled={runState.timeCharges <= 0 || isEditMode}
                    title="Time actions"
                    className={`w-full flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border transition-all duration-200 group cursor-pointer disabled:opacity-40 ${showTimeMenu ? "border-blue-500/60 bg-blue-500/10 text-blue-400" : "border-brand-border bg-brand-bg hover:bg-brand-text/5 hover:border-blue-500/40 text-brand-secondary hover:text-blue-400"}`}
                    style={{ cursor: runState.timeCharges <= 0 || isEditMode ? "not-allowed" : "pointer" }}
                  >
                    <Hourglass className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-medium font-sans tracking-wide">Time ({runState.timeCharges})</span>
                  </button>

                  {showTimeMenu && (
                    <div
                      ref={timeMenuRef}
                      className="absolute right-0 top-full mt-1.5 z-50 min-w-[200px] rounded-xl border border-brand-border bg-brand-surface py-1 shadow-2xl backdrop-blur-md animate-fade-in overflow-hidden"
                      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(212,175,110,0.1)" }}
                    >
                      <button
                        onClick={() => { soundManager.playButtonClick(); handleTimeAction('increase_player'); setShowTimeMenu(false); }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-sans text-brand-secondary hover:text-brand-text hover:bg-brand-text/[0.06] transition-colors duration-150 group cursor-pointer"
                      >
                        <span className="font-sans font-medium flex items-center gap-2">
                          <Plus className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                          Boost My Time
                        </span>
                        <span className="text-[10px] font-mono text-green-400/80">+10%</span>
                      </button>
                      <div className="my-1 border-t border-brand-border/60" />
                      <button
                        onClick={() => { soundManager.playButtonClick(); handleTimeAction('decrease_enemy'); setShowTimeMenu(false); }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-sans text-brand-secondary hover:text-brand-text hover:bg-brand-text/[0.06] transition-colors duration-150 group cursor-pointer"
                      >
                        <span className="font-sans font-medium flex items-center gap-2">
                          <Minus className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                          Slash Enemy Time
                        </span>
                        <span className="text-[10px] font-mono text-red-400/80">-10%</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Difficulty (Read Only in Story Mode) */}
              <div className="space-y-2 text-left opacity-75">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-sans text-brand-secondary">
                    Required Difficulty
                  </label>
                  <span className="text-xs font-semibold text-brand-accent font-sans">
                    {currentConfig.name} ({currentConfig.rating})
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 bg-brand-bg/50 p-1 rounded-lg border border-brand-border pointer-events-none">
                  {([1, 2, 3, 4, 5] as DifficultyLevel[]).map((level) => (
                    <div
                      key={level}
                      className={`py-1 rounded text-center text-xs font-mono transition-all duration-200 ${
                        difficulty === level
                          ? "bg-brand-accent text-brand-bg shadow-sm font-bold"
                          : "text-brand-secondary/50"
                      }`}
                    >
                      {level}
                    </div>
                  ))}
                </div>
              </div>

              {/* DEV Only: Skip Buttons */}
              {(import.meta.env.DEV && import.meta.env.VITE_ENABLE_STORY_DEV_TOOLS !== 'false') && (
                <div className="mt-4 p-2 rounded border border-dashed border-yellow-500/50 bg-yellow-500/10 flex gap-2 justify-center opacity-80 hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-yellow-500 font-mono self-center mr-2">DEV:</span>
                  <button onClick={handleVictory} className="px-2 py-1 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-[10px] font-mono hover:bg-green-500/40 cursor-pointer">Skip (Win)</button>
                  <button onClick={onDefeat} className="px-2 py-1 bg-red-500/20 border border-red-500/50 text-red-400 rounded text-[10px] font-mono hover:bg-red-500/40 cursor-pointer">Skip (Lose)</button>
                </div>
              )}
            </div>

            {/* Move History */}
            <div className={`flex flex-col text-left ${isDesktop ? "flex-1 min-h-[120px]" : ""}`} style={{ height: isDesktop ? undefined : "220px" }}>
              <div
                ref={moveHistoryContainerRef}
                className="flex-1 overflow-y-auto border border-[rgba(212,175,110,0.60)] rounded-lg p-3 bg-brand-bg/40 font-mono text-sm space-y-1 move-history-scroll"
              >
                {movePairs.length === 0 ? (
                  <div className="text-brand-secondary/60 text-xs text-center py-10">
                    Your move, challenger…
                  </div>
                ) : (
                  movePairs.map((pair) => (
                    <div
                      key={pair.num}
                      className="grid grid-cols-12 gap-1 py-1 px-2 rounded hover:bg-brand-text/5 transition-colors"
                    >
                      <span className="col-span-2 text-brand-secondary/70">{pair.num}.</span>
                      <span className="col-span-5 text-brand-text font-medium">{pair.white.san}</span>
                      <span className="col-span-5 text-brand-secondary font-medium">{pair.black?.san ?? ""}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditPositionModal
        initialFen={gameFen}
        isOpen={isEditMode}
        boardOrientation={boardOrientation}
        onSwitchSides={handleSwitchSide}
        onApply={handleApplyEditorPosition}
        onCancel={() => setIsEditMode(false)}
        onValidate={handleValidateEditorPosition}
      />

      {/* ── Victory / Defeat Overlay ──────────────────────────────────────── */}
      <AnimatePresence>
        {battleResult !== "playing" && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex flex-col items-center gap-5 p-8 rounded-2xl border max-w-sm w-full mx-4"
              style={{
                background: battleResult === "victory" ? "rgba(34, 197, 94, 0.08)" : "rgba(239, 68, 68, 0.08)",
                borderColor: battleResult === "victory" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)",
              }}
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              <motion.div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: battleResult === "victory" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  border: `2px solid ${battleResult === "victory" ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
                }}
                animate={{
                  boxShadow: battleResult === "victory"
                    ? ["0 0 20px rgba(34,197,94,0.2)", "0 0 40px rgba(34,197,94,0.4)", "0 0 20px rgba(34,197,94,0.2)"]
                    : ["0 0 20px rgba(239,68,68,0.2)", "0 0 40px rgba(239,68,68,0.4)", "0 0 20px rgba(239,68,68,0.2)"],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {battleResult === "victory" ? (
                  <Trophy className="w-10 h-10 text-green-400" />
                ) : (
                  <Skull className="w-10 h-10 text-red-400" />
                )}
              </motion.div>

              <div className="text-center">
                <h3
                  className="text-2xl font-display font-bold"
                  style={{ color: battleResult === "victory" ? "#4ade80" : "#f87171" }}
                >
                  {battleResult === "victory" ? "Victory!" : "Defeated"}
                </h3>
                <p className="text-sm text-brand-secondary mt-1">
                  {battleResult === "victory"
                    ? `You defeated ${monster.name}! The path ahead opens.`
                    : `${monster.name} has bested you. Try again?`}
                </p>
              </div>

              <div className="flex gap-3 mt-2">
                {battleResult === "defeat" && (
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-all text-sm font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry
                  </button>
                )}
                <button
                  onClick={battleResult === "victory" ? handleVictory : (onDefeat || onRetreat)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-all"
                  style={{
                    borderColor: battleResult === "victory" ? "rgba(34, 197, 94, 0.4)" : "rgba(120,120,140,0.4)",
                    background: battleResult === "victory" ? "rgba(34, 197, 94, 0.1)" : "transparent",
                    color: battleResult === "victory" ? "#4ade80" : "rgba(180,180,190,0.8)",
                  }}
                >
                  {battleResult === "victory" ? (
                    <>
                      <Trophy className="w-4 h-4" />
                      Continue Journey
                    </>
                  ) : (
                    <>
                      <ArrowLeft className="w-4 h-4" />
                      Back to Map
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
