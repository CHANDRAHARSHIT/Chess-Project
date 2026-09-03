/**
 * TestMaiaBoard.tsx
 *
 * Studio-grade interactive chess board for playing against Maia-3.
 * Maia predicts what a human of a given rating (800 - 2600 Elo) would play,
 * rather than the raw engine best move.
 *
 * Sizing & Layout Constraints:
 * - Square, unrounded chessboard with clean 1px borders
 * - Sized to fit within standard desktop/laptop viewports with zero page scrolling
 * - Move log with dedicated visible internal scrollbar
 * - No redundant top banners or heavy shadows
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, DEFAULT_POSITION } from "chess.js";
import { ThemedChessboard } from "@/components/ui-ThemedChessboard";
import { BoardCoordinates } from "@/components/ui-BoardCoordinates";
import { getGameOverReason, playMoveSound } from "@/utils/chess-chessHelpers";
import { soundManager } from "@/lib/SoundManager";
import { useSession } from "@/hooks/account-useSession";
import {
  RotateCcw,
  CornerUpLeft,
  ArrowUpDown,
  Brain,
  Info,
  Trophy,
  X,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useMaia } from "@/hooks/testmaia-useMaia";
import { STRENGTHS, getCapturedPieces } from "@/utils/testmaia-maiaHelpers";
import { MaiaPlayerCard } from "@/components/testmaia-MaiaPlayerCard";
import { MaiaMoveLog } from "@/components/testmaia-MaiaMoveLog";

const MIN_REPLY_DELAY_MS = 600;
const MAX_REPLY_DELAY_MS = 1600;

/** How the game ended, captured when it ends so the overlay never re-derives it. */
type Outcome = "win" | "loss" | "draw";

function getInCheckKingSquare(game: Chess): string | null {
  if (!game.inCheck()) return null;
  const turn = game.turn();
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === "k" && piece.color === turn) {
        const file = String.fromCharCode("a".charCodeAt(0) + c);
        const rank = (8 - r).toString();
        return `${file}${rank}`;
      }
    }
  }
  return null;
}

export default function TestMaiaBoard() {
  const { session } = useSession();
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(DEFAULT_POSITION);

  /** UCI moves from start — Maia conditions on full game history */
  const [history, setHistory] = useState<string[]>([]);
  const [sanHistory, setSanHistory] = useState<string[]>([]);
  const [elo, setElo] = useState<number>(1400);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [status, setStatus] = useState<string | null>(null);
  /**
   * Set only when the game actually ends. `gameRef` knows about threefold
   * repetition and the 50-move rule; a board rebuilt from a FEN does not, so the
   * verdict is captured here at the moment it is known rather than re-derived.
   */
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastMoveSquares, setLastMoveSquares] = useState<{ from?: string; to?: string }>({});
  const [showInfoModal, setShowInfoModal] = useState(false);

  const { getMove, error, invalidate } = useMaia();
  const replyTimer = useRef<number | null>(null);

  const strength = STRENGTHS.find((s) => s.elo === elo) ?? STRENGTHS[2];

  const clearPendingReply = useCallback(() => {
    if (replyTimer.current !== null) {
      window.clearTimeout(replyTimer.current);
      replyTimer.current = null;
    }
    invalidate();
  }, [invalidate]);

  useEffect(() => () => clearPendingReply(), [clearPendingReply]);

  const syncBoard = useCallback(() => {
    const game = gameRef.current;
    setFen(game.fen());
    if (game.isGameOver()) {
      const reason = getGameOverReason(game);
      setStatus(reason);
      soundManager.playGameEnd();

      // Checkmate leaves the mated side to move, so the loser is whoever's turn it is.
      const humanWon = game.isCheckmate() && game.turn() !== playerColor;
      setOutcome(!game.isCheckmate() ? "draw" : humanWon ? "win" : "loss");

      if (humanWon) {
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#d4af6e", "#f5f0e8", "#10b981", "#38bdf8"],
          });
        } catch {
          // decorative only
        }
      }
    }
  }, [playerColor]);

  const playMaiaReply = useCallback(
    async (movesSoFar: string[]) => {
      setBusy(true);
      const requestedAt = Date.now();
      const result = await getMove(movesSoFar, elo);

      if (!result) {
        setBusy(false);
        return;
      }

      setLatency(result.latencyMs);

      const target =
        MIN_REPLY_DELAY_MS + Math.random() * (MAX_REPLY_DELAY_MS - MIN_REPLY_DELAY_MS);
      replyTimer.current = window.setTimeout(
        () => {
          replyTimer.current = null;
          const game = gameRef.current;
          try {
            const move = game.move(result.move);
            playMoveSound(game, move.flags, Boolean(move.captured));
            setLastMoveSquares({ from: move.from, to: move.to });
            setHistory((prev) => [...prev, result.move]);
            setSanHistory((prev) => [...prev, move.san]);
            syncBoard();
          } catch {
            setStatus("Maia returned a move this position does not allow.");
          }
          setBusy(false);
        },
        Math.max(0, target - (Date.now() - requestedAt))
      );
    },
    [elo, getMove, syncBoard]
  );

  const resetGame = useCallback(
    (targetColor = playerColor) => {
      clearPendingReply();
      const freshGame = new Chess();
      gameRef.current = freshGame;
      setHistory([]);
      setSanHistory([]);
      setStatus(null);
      setOutcome(null);
      setBusy(false);
      setLatency(null);
      setLastMoveSquares({});
      setFen(freshGame.fen());
      soundManager.playGameStart();

      // If user plays as Black, Maia makes opening move as White
      if (targetColor === "b") {
        void playMaiaReply([]);
      }
    },
    [clearPendingReply, playerColor, playMaiaReply]
  );

  const onDrop = useCallback(
    ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
      const game = gameRef.current;
      if (!targetSquare || busy || game.isGameOver() || game.turn() !== playerColor) return false;

      let move;
      try {
        move = game.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
      } catch {
        return false;
      }

      playMoveSound(game, move.flags, Boolean(move.captured));
      setLastMoveSquares({ from: move.from, to: move.to });
      const next = [...history, move.lan];
      setHistory(next);
      setSanHistory((prev) => [...prev, move.san]);
      syncBoard();

      if (!game.isGameOver()) void playMaiaReply(next);
      return true;
    },
    [busy, history, playerColor, playMaiaReply, syncBoard]
  );

  /** Takes back the turn (both Maia's reply + user's move) */
  const handleUndo = useCallback(() => {
    clearPendingReply();
    const game = gameRef.current;
    const hist = game.history({ verbose: true });
    if (hist.length === 0) return;

    // Undo engine move + human move (2 half-moves), or 1 if opening
    game.undo();
    if (game.history().length > 0 && game.turn() !== playerColor) {
      game.undo();
    }

    const remaining = game.history({ verbose: true });
    setHistory(remaining.map((m) => m.lan));
    setSanHistory(remaining.map((m) => m.san));
    setStatus(null);
    setOutcome(null);
    setBusy(false);
    setFen(game.fen());

    if (remaining.length > 0) {
      const last = remaining[remaining.length - 1];
      setLastMoveSquares({ from: last.from, to: last.to });
    } else {
      setLastMoveSquares({});
    }

    soundManager.playButtonClick();
  }, [clearPendingReply, playerColor]);

  const handleStrengthChange = useCallback(
    (nextElo: number) => {
      if (nextElo === elo) return;
      setElo(nextElo);
      soundManager.playButtonClick();
      clearPendingReply();
      const freshGame = new Chess();
      gameRef.current = freshGame;
      setHistory([]);
      setSanHistory([]);
      setStatus(null);
      setOutcome(null);
      setBusy(false);
      setLatency(null);
      setLastMoveSquares({});
      setFen(freshGame.fen());

      if (playerColor === "b") {
        setBusy(true);
        void getMove([], nextElo).then((result) => {
          if (!result) {
            setBusy(false);
            return;
          }
          const m = gameRef.current.move(result.move);
          playMoveSound(gameRef.current, m.flags, Boolean(m.captured));
          setLastMoveSquares({ from: m.from, to: m.to });
          setHistory([result.move]);
          setSanHistory([m.san]);
          setFen(gameRef.current.fen());
          setBusy(false);
        });
      }
    },
    [clearPendingReply, elo, getMove, playerColor]
  );

  const handleSwitchSide = useCallback(() => {
    const nextColor = playerColor === "w" ? "b" : "w";
    setPlayerColor(nextColor);
    resetGame(nextColor);
  }, [playerColor, resetGame]);

  /**
   * Render reads this, not `gameRef`. A ref mutation does not re-render, so
   * anything derived from `gameRef` during render is stale until some unrelated
   * state change happens to flush it. `fen` is state, so this always matches
   * what is on screen.
   */
  const position = useMemo(() => new Chess(fen), [fen]);

  // `outcome` covers the endings a FEN cannot see on its own — threefold
  // repetition in particular.
  const isGameOver = outcome !== null || position.isGameOver();
  const currentTurn = position.turn();
  const isHumanTurn = currentTurn === playerColor && !isGameOver;
  const isMaiaTurn = currentTurn !== playerColor && !isGameOver;

  const inCheck = position.inCheck();
  const inCheckKingSquare = useMemo(() => getInCheckKingSquare(position), [position]);

  // Material & captured piece balance
  const materialBalance = useMemo(() => getCapturedPieces(fen), [fen]);

  // White vs Black assignment
  const humanSide = playerColor;
  const maiaSide = playerColor === "w" ? "b" : "w";
  const boardOrientation = playerColor === "w" ? "white" : "black";

  const humanCaptured =
    humanSide === "w" ? materialBalance.whiteCaptured : materialBalance.blackCaptured;
  const maiaCaptured =
    maiaSide === "w" ? materialBalance.whiteCaptured : materialBalance.blackCaptured;

  const humanAdvantage =
    humanSide === "w"
      ? Math.max(0, materialBalance.whiteAdvantage)
      : Math.max(0, -materialBalance.whiteAdvantage);
  const maiaAdvantage =
    maiaSide === "w"
      ? Math.max(0, materialBalance.whiteAdvantage)
      : Math.max(0, -materialBalance.whiteAdvantage);

  // Square Highlights: Last move + King in check
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (lastMoveSquares.from) {
      styles[lastMoveSquares.from] = {
        backgroundColor: "rgba(212, 175, 110, 0.30)",
      };
    }
    if (lastMoveSquares.to) {
      styles[lastMoveSquares.to] = {
        backgroundColor: "rgba(212, 175, 110, 0.45)",
      };
    }
    if (inCheckKingSquare) {
      styles[inCheckKingSquare] = {
        backgroundColor: "rgba(239, 68, 68, 0.45)",
        boxShadow: "inset 0 0 0 2px rgba(239, 68, 68, 0.8)",
      };
    }
    return styles;
  }, [lastMoveSquares, inCheckKingSquare]);

  const canUndo = history.length > 0 && !busy && !isGameOver;

  return (
    <div className="w-full max-w-5xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3 flex flex-col gap-2.5 select-none">
      {/* ── Main Studio Arena: Board Arena (Left) & Control Console (Right) ── */}
      <div className="w-full flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-4 lg:gap-5">
        {/* ── Left Column: Opponent Bar + Square Board + Player Bar ── */}
        <div className="w-full max-w-[420px] lg:max-w-[440px] flex flex-col gap-2 shrink-0">
          {/* Opponent Player Header */}
          <MaiaPlayerCard
            isBot={true}
            name="Maia-3"
            side={maiaSide}
            elo={strength.elo}
            eloName={strength.name}
            isTurn={isMaiaTurn}
            isThinking={busy}
            inCheck={inCheck && currentTurn === maiaSide}
            capturedPieces={maiaCaptured}
            advantage={maiaAdvantage}
            latencyMs={latency}
          />

          {/* Square Chessboard Container (No rounded corners) */}
          <div
            className="relative w-full aspect-square border border-white/10 bg-brand-surface/70 backdrop-blur-md p-1.5 overflow-hidden"
            style={{ borderRadius: "0px" }}
          >
            <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: "0px" }}>
              <ThemedChessboard
                options={{
                  position: fen,
                  onPieceDrop: onDrop,
                  boardOrientation: boardOrientation,
                  squareStyles: customSquareStyles,
                  boardStyle: { borderRadius: "0px" },
                  showNotation: false,
                  allowDragging: !busy && !isGameOver && isHumanTurn,
                }}
              />
              <BoardCoordinates boardOrientation={boardOrientation} />

              {/* Game Over Overlay */}
              {status && (
                <div className="absolute inset-0 z-30 bg-brand-bg/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in space-y-3">
                  <div className="w-10 h-10 rounded-full border border-brand-accent/30 bg-brand-accent/15 flex items-center justify-center text-brand-accent">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-brand-text">
                      {outcome === "draw"
                        ? "Draw!"
                        : outcome === "win"
                          ? "You Won!"
                          : outcome === "loss"
                            ? "Maia Won!"
                            : "Game Finished"}
                    </h3>
                    <p className="text-xs text-brand-secondary mt-0.5 font-mono">{status}</p>
                  </div>
                  <button
                    onClick={() => resetGame()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-accent text-black font-mono text-xs font-bold hover:bg-brand-accent/90 active:scale-95 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Play Again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Human Player Footer */}
          <MaiaPlayerCard
            isBot={false}
            name={session?.user?.name || "You"}
            avatarUrl={session?.user?.image || undefined}
            side={humanSide}
            isTurn={isHumanTurn}
            inCheck={inCheck && currentTurn === humanSide}
            capturedPieces={humanCaptured}
            advantage={humanAdvantage}
          />
        </div>

        {/* ── Right Column: Studio Console (Strength + Actions + Move Log + Status) ── */}
        <div className="w-full max-w-[420px] lg:max-w-none lg:flex-1 lg:h-[552px] flex flex-col gap-2 min-h-0 overflow-hidden">
          {/* 1. Opponent Strength Chip Bar */}
          <div className="p-2.5 rounded-xl bg-brand-surface/70 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold tracking-wider text-brand-secondary uppercase">
                Opponent Strength
              </span>
              <span className="font-mono text-xs text-brand-accent font-bold">
                {strength.name} • {strength.elo}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {STRENGTHS.map((s) => {
                const active = elo === s.elo;
                return (
                  <button
                    key={s.elo}
                    onClick={() => handleStrengthChange(s.elo)}
                    aria-pressed={active}
                    title={`${s.name} (${s.elo} Elo) — ${s.tag}`}
                    className={`py-1 px-0.5 rounded text-center transition-all duration-150 border cursor-pointer ${
                      active
                        ? "bg-brand-accent text-black border-brand-accent font-bold"
                        : "border-white/5 bg-brand-surface/40 text-brand-secondary hover:text-brand-text hover:bg-white/5"
                    }`}
                  >
                    <span className="block text-[10px] font-mono leading-tight">{s.short}</span>
                    <span
                      className={`block text-[8px] truncate leading-tight mt-0.5 font-sans ${
                        active ? "text-black/75 font-semibold" : "text-brand-secondary/70"
                      }`}
                    >
                      {s.name.slice(0, 3)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Quick Action Toolbar */}
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => resetGame()}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl border border-white/10 bg-brand-surface/70 text-brand-text hover:border-brand-accent/40 hover:bg-brand-surface text-xs font-mono font-semibold transition-all active:scale-95 cursor-pointer"
              title="Start a new game"
            >
              <RotateCcw className="w-3.5 h-3.5 text-brand-accent" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl border border-white/10 bg-brand-surface/70 text-brand-text hover:border-brand-accent/40 hover:bg-brand-surface text-xs font-mono font-semibold transition-all active:scale-95 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
              title="Take back turn"
            >
              <CornerUpLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Undo</span>
            </button>

            <button
              onClick={handleSwitchSide}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl border border-white/10 bg-brand-surface/70 text-brand-text hover:border-brand-accent/40 hover:bg-brand-surface text-xs font-mono font-semibold transition-all active:scale-95 cursor-pointer"
              title={`Currently playing as ${playerColor === "w" ? "White" : "Black"}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-sky-400" />
              <span>{playerColor === "w" ? "Black" : "White"}</span>
            </button>

            <button
              onClick={() => setShowInfoModal(true)}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl border border-white/10 bg-brand-surface/70 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 hover:bg-brand-surface text-xs font-mono font-semibold transition-all active:scale-95 cursor-pointer"
              title="About Maia Model"
            >
              <Info className="w-3.5 h-3.5 text-brand-accent" />
              <span>Info</span>
            </button>
          </div>

          {/* 3. Main Live Move Notation Log with Dedicated Internal Scrollbar */}
          <div className="flex-1 min-h-[160px] lg:min-h-0 overflow-hidden">
            <MaiaMoveLog sanHistory={sanHistory} />
          </div>

          {/* 4. Live Neural Status Footer */}
          <div className="p-2.5 rounded-xl bg-brand-surface/70 border border-white/10 backdrop-blur-md flex items-center justify-between text-xs font-mono shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  busy
                    ? "bg-amber-400 animate-ping"
                    : isHumanTurn
                      ? "bg-emerald-400"
                      : "bg-brand-secondary"
                }`}
              />
              <span className="text-brand-secondary truncate text-[11px]">
                {busy
                  ? "Maia neural prediction in progress…"
                  : error
                    ? error
                    : status
                      ? status
                      : isHumanTurn
                        ? "Your move. Make a move on the board."
                        : "Waiting for Maia..."}
              </span>
            </div>

            {latency && !busy && (
              <span className="text-[10px] text-brand-secondary/60 shrink-0 ml-2">
                {latency}ms
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Maia Explanation Modal ── */}
      {showInfoModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="max-w-md w-full rounded-2xl border border-white/15 bg-brand-surface/95 backdrop-blur-xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand-accent">
                <Brain className="w-5 h-5" />
                <h3 className="font-display text-lg font-bold text-brand-text">About Maia-3</h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 rounded-lg text-brand-secondary hover:text-brand-text hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-brand-secondary leading-relaxed">
              Unlike traditional chess engines like Stockfish that calculate the mathematically
              strongest moves, Maia-3 is a deep neural network trained directly on millions of human
              games from Lichess.
            </p>

            <div className="p-3 rounded-xl bg-brand-bg/60 border border-white/10 space-y-1 text-xs">
              <p className="font-bold text-brand-text">How it benefits your training:</p>
              <ul className="list-disc list-inside text-brand-secondary/90 space-y-0.5 text-[11px]">
                <li>Plays genuine human tactical motifs, habits, and realistic blunders.</li>
                <li>Provides targeted practice calibrated to specific Elo brackets (800 to 2600).</li>
                <li>Feels like playing a real tournament or club opponent.</li>
              </ul>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-1.5 rounded-xl bg-brand-accent text-black text-xs font-mono font-bold hover:bg-brand-accent/90 transition-all cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
