/**
 * StoryModeBattle.tsx
 *
 * Full chess battle screen for story mode monster/boss encounters.
 * Merges the luxury UI of the Quick Game (QuickGameBoard) with Story Mode RPG elements.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chess } from "chess.js";
import { ThemedChessboard } from "@/shared/ui/ThemedChessboard";
import { useStockfish } from "@/shared/hooks/useStockfish";
import {
  parseUciMove,
  getGameOverReason,
  playMoveSound,
} from "@/shared/chess/chessHelpers";
import { EvaluationBar } from "@/shared/ui/EvaluationBar";
import { soundManager } from "@/shared/lib/SoundManager";
import {
  MONSTER_PROFILES,
  type MonsterProfile,
} from "@/features/story-mode/storyModeMapData";
import { DIFFICULTY_CONFIGS, type DifficultyLevel } from "@/shared/chess/chess.types";

import { EditPositionModal } from "@/shared/ui/EditPositionModal";
import {
  validateEditorPosition,
  type EditorPositionState,
} from "@/shared/chess/positionEditor";
import rollbar from "@/shared/lib/rollbar";
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
import { useScrollReveal } from "@/shared/hooks/useScrollReveal";
import { BoardCoordinates } from "@/shared/ui/BoardCoordinates";
import { useStoryModeRun } from "./StoryModeContext";
import { useSession } from "@/features/account/useSession";
import { OdysseyApiService, type OdysseyBattleEndReason } from "./api/odysseyApi";

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
  const { runState, useCharge, addCoins, activeSlot } = useStoryModeRun();
  const { status } = useSession();

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
  const playerInitialTime = useMemo(() => {
    switch (difficulty) {
      case 5: return 180; // 3 min
      case 4: return 300; // 5 min
      case 3: return 420; // 7 min
      case 2: return 480; // 8 min
      case 1:
      default: return 600; // 10 min
    }
  }, [difficulty]);

  const enemyInitialTime = useMemo(() => {
    switch (difficulty) {
      case 5: return 120; // 2 min for Boss
      case 4: return 90;
      default: return 60; // 1 min for lower difficulties
    }
  }, [difficulty]);

  const [playerTime, setPlayerTime] = useState<number>(playerInitialTime);
  const [enemyTime, setEnemyTime] = useState<number>(enemyInitialTime);

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
  // Monster profile dynamically assigned based on difficulty/type
  const monster: MonsterProfile = useMemo(() => {
    const mapNode = runState.mapNodes?.find((n) => n.id === nodeId);
    const nodeType = mapNode?.type || "enemy";
    
    if (difficulty === 5 || nodeType === "boss") return MONSTER_PROFILES[10];
    if (difficulty === 4) return MONSTER_PROFILES[9];
    if (difficulty === 3) return MONSTER_PROFILES[7];
    if (difficulty === 2) {
      // 50/50 for elite knight or bishop
      return (nodeId % 2 === 0) ? MONSTER_PROFILES[3] : MONSTER_PROFILES[6];
    }
    return MONSTER_PROFILES[0];
  }, [nodeId, difficulty, runState.mapNodes]);

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

  // ── Bot Status Conditions ─────────────────────────────────────────────────
  const STATUS_IMPACT = {
    CHECK: { confused: 15 },
    CAPTURE: { distracted: 20 },
    PASSIVE: { relaxed: 10 },
    UNDO: { confused: 25 },
    HINT: { distracted: 15 },
    EVAL: { relaxed: 15 },
    TIME_STALL: { relaxed: 10 },
    TIME_STEAL: { distracted: 20 },
  };

  const [botStatus, setBotStatus] = useState({
    confused: 0,
    relaxed: 0,
    distracted: 0,
  });

  const [activePopup, setActivePopup] = useState<'confused' | 'relaxed' | 'distracted' | null>(null);
  const prevBotStatus = useRef(botStatus);

  useEffect(() => {
    if (botStatus.confused >= 100 && prevBotStatus.current.confused < 100) {
      setActivePopup('confused');
    } else if (botStatus.relaxed >= 100 && prevBotStatus.current.relaxed < 100) {
      setActivePopup('relaxed');
    } else if (botStatus.distracted >= 100 && prevBotStatus.current.distracted < 100) {
      setActivePopup('distracted');
    }
    prevBotStatus.current = botStatus;
  }, [botStatus]);

  useEffect(() => {
    if (!activePopup) return;
    const timer = setTimeout(() => setActivePopup(null), 5000);
    return () => clearTimeout(timer);
  }, [activePopup]);

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

    const isConfused = botStatus.confused >= 100;
    const isRelaxed = botStatus.relaxed >= 100;
    const isDistracted = botStatus.distracted >= 100;

    let effectiveDifficulty = difficulty;
    if (isRelaxed) {
      effectiveDifficulty = 1; // Play weak
    }

    if (isDistracted) {
      // Burn 15 seconds from enemy clock
      setEnemyTime(prev => Math.max(1, prev - 15));
    }

    const timer = setTimeout(() => {
      getEngineMove(game.fen(), effectiveDifficulty, (bestMoveStr) => {
        let moveObj = null;

        // Confused bot has 50% chance to play a random legal move
        if (isConfused && Math.random() < 0.5) {
          const legalMoves = gameRef.current.moves({ verbose: true });
          if (legalMoves.length > 0) {
            const rm = legalMoves[Math.floor(Math.random() * legalMoves.length)];
            try {
              moveObj = gameRef.current.move({ from: rm.from, to: rm.to, promotion: rm.promotion || 'q' });
            } catch (e) { /* fallback */ }
          }
        }

        // Normal engine move if not confused or if random move failed
        if (!moveObj) {
          const { from, to, promotion } = parseUciMove(bestMoveStr);
          try {
            moveObj = gameRef.current.move({ from, to, promotion: promotion || "q" });
          } catch (e) {
            console.error("AI tried invalid move:", bestMoveStr, e);
            rollbar.error(e as Error, { context: "StoryModeBattle.applyEngineMove", bestMoveStr });
          }
        }

        if (moveObj) {
          setGameFen(gameRef.current.fen());
          playMoveSound(gameRef.current, moveObj.flags, !!moveObj.captured);

          // Reset consumed status conditions after the AI makes its move
          setBotStatus(prev => ({
            confused: isConfused ? 0 : prev.confused,
            relaxed: isRelaxed ? 0 : prev.relaxed,
            distracted: isDistracted ? 0 : prev.distracted,
          }));
        }
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [gameFen, playerColor, difficulty, getEngineMove, isEditMode, botStatus]);

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

          // Update Bot Status Conditions based on move
          setBotStatus(prev => {
            let newConfused = prev.confused;
            let newRelaxed = prev.relaxed;
            let newDistracted = prev.distracted;

            // Checking the king adds Confusion
            if (game.inCheck()) {
              newConfused = Math.min(100, newConfused + STATUS_IMPACT.CHECK.confused);
            }
            // Capturing a piece adds Distraction
            if (move.flags.includes('c') || move.flags.includes('e')) {
              newDistracted = Math.min(100, newDistracted + STATUS_IMPACT.CAPTURE.distracted);
            } 
            // Passive moves (no check, no capture) add Relaxed
            if (!game.inCheck() && !move.flags.includes('c') && !move.flags.includes('e')) {
              newRelaxed = Math.min(100, newRelaxed + STATUS_IMPACT.PASSIVE.relaxed);
            }

            return { confused: newConfused, relaxed: newRelaxed, distracted: newDistracted };
          });

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

    // Reversing time severely confuses the bot
    setBotStatus(prev => ({
      ...prev,
      confused: Math.min(100, prev.confused + STATUS_IMPACT.UNDO.confused)
    }));
  }, [playerColor, stopSearch, runState.undoCharges, useCharge]);

  const handleHint = useCallback(() => {
    if (runState.hintCharges <= 0) return;
    const used = useCharge('hint');
    if (!used) return;

    setShowHint(true);
    analyzePosition(gameRef.current.fen(), 2500);

    // Using a hint distracts the bot as you consult an external source
    setBotStatus(prev => ({
      ...prev,
      distracted: Math.min(100, prev.distracted + STATUS_IMPACT.HINT.distracted)
    }));
  }, [analyzePosition, runState.hintCharges, useCharge]);

  const handleActivateEval = useCallback(() => {
    if (runState.evalBarCharges <= 0) return;
    const used = useCharge('evalBar');
    if (!used) return;
    
    const moves = 5;
    setEvalMovesRemaining(prev => prev + moves);

    // Turning on the eval bar means you're playing carefully, relaxing the bot
    setBotStatus(prev => ({
      ...prev,
      relaxed: Math.min(100, prev.relaxed + STATUS_IMPACT.EVAL.relaxed)
    }));
  }, [useCharge, runState.evalBarCharges]);

  const handleTimeAction = useCallback((action: 'increase_player' | 'decrease_enemy') => {
    if (runState.timeCharges <= 0) return;
    const used = useCharge('time');
    if (!used) return;

    if (action === 'increase_player') {
      setPlayerTime(prev => prev + Math.floor(playerInitialTime * 0.1));
      // Stalling for time relaxes the bot
      setBotStatus(prev => ({ ...prev, relaxed: Math.min(100, prev.relaxed + STATUS_IMPACT.TIME_STALL.relaxed) }));
    } else {
      setEnemyTime(prev => Math.max(1, prev - Math.floor(enemyInitialTime * 0.1)));
      // Stealing the enemy's time distracts/panics them
      setBotStatus(prev => ({ ...prev, distracted: Math.min(100, prev.distracted + STATUS_IMPACT.TIME_STEAL.distracted) }));
    }
  }, [useCharge, runState.timeCharges]);

  const handleVictory = useCallback(() => {
    const baseCoins = difficulty === 5 ? 50 : difficulty >= 3 ? 30 : 15;
    addCoins(baseCoins);

    // Best-effort backend sync — coins above are already the authoritative local reward.
    // nodeId 0 is skipped: the frontend always renders it as an immediate battle (matching
    // mapGenerator.ts's own convention), but the backend's node 0 is genuinely its Start
    // node (not an OdysseyBattleNode) — resolveBattleOutcome would 400 for it.
    if (status === 'authenticated' && nodeId !== 0) {
      const endReason: OdysseyBattleEndReason =
        gameOverReason === 'timeout' ? 'timeout' : gameRef.current.isCheckmate() ? 'checkmate' : 'draw';
      OdysseyApiService.resolveBattleOutcome(
        activeSlot,
        nodeId,
        {
          playerInitialSeconds: playerInitialTime,
          enemyInitialSeconds: enemyInitialTime,
          playerSeconds: playerTime,
          enemySeconds: enemyTime,
          evalMovesRemaining,
          botConditions: botStatus,
        },
        endReason,
        true
      );
    }

    onVictory();
  }, [
    addCoins,
    difficulty,
    onVictory,
    status,
    activeSlot,
    nodeId,
    gameOverReason,
    playerInitialTime,
    enemyInitialTime,
    playerTime,
    enemyTime,
    evalMovesRemaining,
    botStatus,
  ]);

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
      setPlayerTime(playerInitialTime);
      setEnemyTime(enemyInitialTime);
      resetEvaluation();
      setDisplayEval({ type: "cp", value: 0 });
      setBotStatus({ confused: 0, relaxed: 0, distracted: 0 });
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

  if (gameRef.current.inCheck()) {
    const turn = gameRef.current.turn();
    const board = gameRef.current.board();
    for (const row of board) {
      for (const piece of row) {
        if (piece && piece.type === "k" && piece.color === turn) {
          customSquareStyles[piece.square] = {
            ...customSquareStyles[piece.square],
            backgroundColor: "rgba(239, 68, 68, 0.7)",
            boxShadow: "inset 0 0 20px rgba(220, 38, 38, 0.9)",
          };
        }
      }
    }
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
      className="w-full flex flex-col items-center gap-1 py-1 px-1 sm:px-2 flex-1 min-h-0 h-full"
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
          <span className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl shadow-lg border ${
            difficulty === 5 
              ? "bg-red-500/20 text-red-400 border-red-500/50 animate-pulse" 
              : "bg-brand-surface border-brand-border/60 text-brand-accent"
          }`}>
            {monster.icon}
          </span>
          <div>
            <h2 className={`text-xl sm:text-2xl font-display font-bold ${
              difficulty === 5 
                ? "text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-600 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                : "text-brand-text"
            }`}>
              {difficulty === 5 ? `BOSS: ${monster.name}` : monster.name}
            </h2>
            <p className="text-xs font-mono text-brand-secondary mt-0.5">
              {monster.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Swords className={`w-3.5 h-3.5 ${difficulty === 5 ? "text-red-500" : "text-red-400"}`} />
          <span className={`text-xs font-mono ${difficulty === 5 ? "text-red-500 font-bold" : "text-red-400"}`}>
            Rating {monster.rating}
          </span>
          <span className="text-xs text-brand-secondary">•</span>
          <span className="text-xs font-mono text-brand-secondary">
            Difficulty {difficulty}/5
          </span>
        </div>
      </motion.div>

      {/* Bot Status Conditions */}
      <motion.div
        className="flex items-center justify-center gap-4 mt-4 relative"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >

        <div className="luxury-card rounded-xl px-2 sm:px-5 py-2 sm:py-3 flex items-center justify-center gap-2 sm:gap-6 border border-brand-border/40 shadow-xl bg-black/60 relative w-full sm:w-auto overflow-hidden sm:overflow-visible">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-green-500/5 to-yellow-500/5 rounded-xl pointer-events-none" />

          {/* Confused */}
          <div className="relative">
            <AnimatePresence>
              {activePopup === 'confused' && (
                <motion.div
                  key="popup-confused"
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: -10 }}
                  exit={{ opacity: 0, scale: 0.8, y: 0 }}
                  className="absolute bottom-[calc(100%+15px)] left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
                >
                  <div className="luxury-card px-4 py-3 rounded-2xl shadow-xl border border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center gap-3 whitespace-nowrap">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-red-500/40 overflow-hidden">
                      <img src="/confused_status.png" alt="Confused" className="w-8 h-8 animate-bounce object-contain" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-display font-bold text-red-400 tracking-wider drop-shadow-md">BOT CONFUSED!</span>
                      <span className="text-[10px] text-brand-secondary font-mono">Random blunder possible</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className={`flex items-center gap-1.5 sm:gap-3 relative z-10 transition-transform duration-300 ${activePopup === 'confused' ? 'scale-105' : ''}`}>
              <div className={`w-7 h-7 sm:w-10 sm:h-10 shrink-0 rounded-md sm:rounded-lg flex items-center justify-center bg-white border border-brand-border/30 overflow-hidden relative ${activePopup === 'confused' ? 'animate-pulse drop-shadow-[0_0_12px_rgba(248,113,113,0.5)] border-red-500/50' : ''}`}>
                <img src="/confused_status.png" alt="Confused" className="w-5 h-5 sm:w-8 sm:h-8 object-contain" />
                {activePopup !== 'confused' && <div className="absolute inset-0 bg-black/50" />}
              </div>
              <div className="flex flex-col">
                <span className={`text-[8px] sm:text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 ${activePopup === 'confused' ? 'text-red-400' : 'text-brand-secondary'}`}>
                  Confused
                </span>
                <div className="w-12 sm:w-24 h-1.5 sm:h-2.5 bg-black/40 rounded-full mt-0.5 sm:mt-2 overflow-hidden shadow-inner border border-brand-border/20">
                  <div className="h-full bg-red-400 transition-all duration-500 relative" style={{ width: `${Math.min(botStatus.confused, 100)}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-px h-10 bg-brand-border/40 hidden sm:block"></div>

          {/* Relaxed */}
          <div className="relative">
            <AnimatePresence>
              {activePopup === 'relaxed' && (
                <motion.div
                  key="popup-relaxed"
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: -10 }}
                  exit={{ opacity: 0, scale: 0.8, y: 0 }}
                  className="absolute bottom-[calc(100%+15px)] left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
                >
                  <div className="luxury-card px-4 py-3 rounded-2xl shadow-xl border border-green-500/60 shadow-[0_0_20px_rgba(74,222,128,0.3)] flex items-center gap-3 whitespace-nowrap">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-green-500/40 overflow-hidden">
                      <img src="/relaxed_status.png" alt="Relaxed" className="w-8 h-8 animate-pulse object-contain" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-display font-bold text-green-400 tracking-wider drop-shadow-md">BOT RELAXED!</span>
                      <span className="text-[10px] text-brand-secondary font-mono">Difficulty drops to 1</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className={`flex items-center gap-1.5 sm:gap-3 relative z-10 transition-transform duration-300 ${activePopup === 'relaxed' ? 'scale-105' : ''}`}>
              <div className={`w-7 h-7 sm:w-10 sm:h-10 shrink-0 rounded-md sm:rounded-lg flex items-center justify-center bg-white border border-brand-border/30 overflow-hidden relative ${activePopup === 'relaxed' ? 'animate-pulse drop-shadow-[0_0_12px_rgba(74,222,128,0.5)] border-green-500/50' : ''}`}>
                <img src="/relaxed_status.png" alt="Relaxed" className="w-5 h-5 sm:w-8 sm:h-8 object-contain" />
                {activePopup !== 'relaxed' && <div className="absolute inset-0 bg-black/50" />}
              </div>
              <div className="flex flex-col">
                <span className={`text-[8px] sm:text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 ${activePopup === 'relaxed' ? 'text-green-400' : 'text-brand-secondary'}`}>
                  Relaxed
                </span>
                <div className="w-12 sm:w-24 h-1.5 sm:h-2.5 bg-black/40 rounded-full mt-0.5 sm:mt-2 overflow-hidden shadow-inner border border-brand-border/20">
                  <div className="h-full bg-green-400 transition-all duration-500 relative" style={{ width: `${Math.min(botStatus.relaxed, 100)}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-px h-10 bg-brand-border/40 hidden sm:block"></div>

          {/* Distracted */}
          <div className="relative">
            <AnimatePresence>
              {activePopup === 'distracted' && (
                <motion.div
                  key="popup-distracted"
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: -10 }}
                  exit={{ opacity: 0, scale: 0.8, y: 0 }}
                  className="absolute bottom-[calc(100%+15px)] left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
                >
                  <div className="luxury-card px-4 py-3 rounded-2xl shadow-xl border border-yellow-500/60 shadow-[0_0_20px_rgba(250,204,21,0.3)] flex items-center gap-3 whitespace-nowrap">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-yellow-500/40 overflow-hidden">
                      <img src="/distracted_status.png" alt="Distracted" className="w-8 h-8 animate-pulse object-contain" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-display font-bold text-yellow-400 tracking-wider drop-shadow-md">BOT DISTRACTED!</span>
                      <span className="text-[10px] text-brand-secondary font-mono">Lost 15 seconds</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className={`flex items-center gap-1.5 sm:gap-3 relative z-10 transition-transform duration-300 ${botStatus.distracted >= 100 ? 'scale-105' : ''}`}>
              <div className={`w-7 h-7 sm:w-10 sm:h-10 shrink-0 rounded-md sm:rounded-lg flex items-center justify-center bg-white border border-brand-border/30 overflow-hidden relative ${botStatus.distracted >= 100 ? 'animate-pulse drop-shadow-[0_0_12px_rgba(250,204,21,0.5)] border-yellow-500/50' : ''}`}>
                <img src="/distracted_status.png" alt="Distracted" className="w-5 h-5 sm:w-8 sm:h-8 object-contain" />
                {botStatus.distracted < 100 && <div className="absolute inset-0 bg-black/50" />}
              </div>
              <div className="flex flex-col">
                <span className={`text-[8px] sm:text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 ${botStatus.distracted >= 100 ? 'text-yellow-400' : 'text-brand-secondary'}`}>
                  Distracted
                </span>
                <div className="w-12 sm:w-24 h-1.5 sm:h-2.5 bg-black/40 rounded-full mt-0.5 sm:mt-2 overflow-hidden shadow-inner border border-brand-border/20">
                  <div className="h-full bg-yellow-400 transition-all duration-500 relative" style={{ width: `${Math.min(botStatus.distracted, 100)}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
      <div
        ref={dashboardRef}
        className="luxury-card rounded-sm shadow-2xl p-2 sm:p-4 lg:p-4 w-full max-w-full mx-auto relative h-fit max-h-full my-auto flex flex-col"
        style={{ opacity: 0 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-center flex-1 min-h-0">
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
          <div className="lg:col-span-7 flex flex-col lg:justify-start justify-center flex-1 min-h-0 items-center overflow-hidden w-full h-full">
            <div
              ref={boardContainerRef}
              className="aspect-square mx-auto shadow-xl border border-brand-border relative overflow-hidden flex-shrink"
              style={{ borderRadius: "4px", transform: "translateZ(0)", maxWidth: "100%", maxHeight: "100%", width: "100%" }}
            >
              <ThemedChessboard
                options={{
                  position: gameFen,
                  onPieceDrop: ({ sourceSquare, targetSquare }) =>
                    onDrop(sourceSquare, targetSquare),
                  boardOrientation,
                  squareStyles: customSquareStyles,
                  boardStyle: { borderRadius: "0px" },
                  showNotation: false,
                  allowDragging: battleResult === "playing" && !isEditMode,
                }}
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
                  <CornerUpLeft className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))" }} />
                  <span className="text-[10px] font-medium font-sans tracking-wide" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>Undo ({runState.undoCharges})</span>
                </button>

                <button
                  onClick={() => { soundManager.playButtonClick(); handleHint(); }}
                  disabled={!!gameOverReason || isThinking || isEditMode || currentTurn !== playerColor || runState.hintCharges <= 0}
                  title="Get a hint"
                  className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border border-brand-border bg-brand-bg hover:bg-brand-text/5 hover:border-[rgba(212,175,110,0.4)] text-brand-secondary hover:text-yellow-400 transition-all duration-200 disabled:opacity-40 group cursor-pointer"
                  style={{ cursor: !!gameOverReason || isThinking || isEditMode || currentTurn !== playerColor || runState.hintCharges <= 0 ? "not-allowed" : "pointer" }}
                >
                  <Lightbulb className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))" }} />
                  <span className="text-[10px] font-medium font-sans tracking-wide" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>Hint ({runState.hintCharges})</span>
                </button>

                <button
                  onClick={handleRetry}
                  disabled={!canUndo || isEditMode}
                  title="Reset game"
                  className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border border-brand-border bg-brand-bg hover:bg-brand-text/5 hover:border-red-500/40 text-brand-secondary hover:text-red-400 transition-all duration-200 disabled:opacity-40 group cursor-pointer"
                  style={{ cursor: !canUndo || isEditMode ? "not-allowed" : "pointer" }}
                >
                  <RotateCcw className="w-5 h-5 group-hover:rotate-[-45deg] transition-transform duration-300" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))" }} />
                  <span className="text-[10px] font-medium font-sans tracking-wide" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>Reset</span>
                </button>

                <button
                  onClick={() => { soundManager.playButtonClick(); handleActivateEval(); }}
                  disabled={runState.evalBarCharges <= 0 || isEditMode}
                  title="Activate Eval Bar"
                  className="w-full flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border border-brand-border bg-brand-bg hover:bg-brand-text/5 hover:border-emerald-500/40 text-brand-secondary hover:text-emerald-400 transition-all duration-200 disabled:opacity-40 group cursor-pointer"
                  style={{ cursor: runState.evalBarCharges <= 0 || isEditMode ? "not-allowed" : "pointer" }}
                >
                  <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))" }} />
                  <span className="text-[10px] font-medium font-sans tracking-wide" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>Eval ({runState.evalBarCharges})</span>
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
                    <Hourglass className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))" }} />
                    <span className="text-[10px] font-medium font-sans tracking-wide" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>Time ({runState.timeCharges})</span>
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
                  <label className="text-xs font-sans text-brand-secondary" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                    Required Difficulty
                  </label>
                  <span className="text-xs font-semibold text-brand-accent font-sans" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
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
                      style={{ textShadow: difficulty === level ? "none" : "0 1px 2px rgba(0,0,0,0.8)" }}
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
                {battleResult === "victory" && (
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    <span className="text-yellow-400 font-bold font-mono text-lg flex items-center gap-1.5 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                      +{difficulty === 5 ? 50 : difficulty >= 3 ? 30 : 15} Coins
                    </span>
                  </div>
                )}
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
