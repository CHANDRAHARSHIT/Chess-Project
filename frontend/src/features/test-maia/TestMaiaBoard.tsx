/**
 * Play against Maia-3 — a deliberately minimal board for evaluating whether the
 * engine feels human.
 *
 * Standard chess only, no position editor, no Chess960, no evaluation bar. The
 * board, a strength selector, and enough state to finish a game.
 *
 * Difficulty maps to Maia's Elo, which is the whole point: Maia imitates a
 * player of that rating rather than playing at a throttled strength.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { ThemedChessboard } from "@/shared/ui/ThemedChessboard";
import { getGameOverReason, playMoveSound } from "@/shared/chess/chessHelpers";
import { soundManager } from "@/shared/lib/SoundManager";
import { RotateCcw, CornerUpLeft, AlertCircle, Loader2 } from "lucide-react";
import { useMaia } from "./useMaia";

/** Elo values Maia is asked to imitate. Labels mirror the existing difficulty UI. */
const STRENGTHS = [
  { elo: 800, name: "Beginner" },
  { elo: 1100, name: "Casual" },
  { elo: 1400, name: "Intermediate" },
  { elo: 1700, name: "Club" },
  { elo: 2000, name: "Strong" },
  { elo: 2300, name: "Expert" },
  { elo: 2600, name: "Master" },
] as const;

/**
 * Maia answers in well under a second, which feels robotic. A short delay makes
 * the opponent read as a person thinking rather than a service responding.
 */
const MIN_REPLY_DELAY_MS = 600;
const MAX_REPLY_DELAY_MS = 1800;

export default function TestMaiaBoard() {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  /** UCI move list from the start — Maia conditions on game history, not just the FEN. */
  const [history, setHistory] = useState<string[]>([]);
  const [elo, setElo] = useState<number>(1400);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { getMove, isThinking, error, invalidate } = useMaia();
  const replyTimer = useRef<number | null>(null);

  const syncBoard = useCallback(() => {
    const game = gameRef.current;
    setFen(game.fen());
    if (game.isGameOver()) {
      setStatus(getGameOverReason(game));
    }
  }, []);

  const clearPendingReply = useCallback(() => {
    if (replyTimer.current !== null) {
      window.clearTimeout(replyTimer.current);
      replyTimer.current = null;
    }
    invalidate();
  }, [invalidate]);

  useEffect(() => () => clearPendingReply(), [clearPendingReply]);

  /** Requests and plays Maia's reply for the current position. */
  const playMaiaReply = useCallback(
    async (movesSoFar: string[]) => {
      setBusy(true);
      const requestedAt = Date.now();
      const result = await getMove(movesSoFar, elo);

      if (!result) {
        setBusy(false);
        return;
      }

      // Pad out to a human-looking think time; Maia itself replies in ~100ms.
      const target = MIN_REPLY_DELAY_MS + Math.random() * (MAX_REPLY_DELAY_MS - MIN_REPLY_DELAY_MS);
      const wait = Math.max(0, target - (Date.now() - requestedAt));

      replyTimer.current = window.setTimeout(() => {
        replyTimer.current = null;
        const game = gameRef.current;
        try {
          const move = game.move(result.move);
          playMoveSound(game, move.flags, Boolean(move.captured));
          setHistory((prev) => [...prev, result.move]);
          syncBoard();
        } catch {
          setStatus("Maia returned a move this position does not allow.");
        }
        setBusy(false);
      }, wait);
    },
    [elo, getMove, syncBoard]
  );

  const onDrop = useCallback(
    ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
      const game = gameRef.current;
      if (!targetSquare || busy || game.isGameOver()) return false;
      // The human is always White here — keeps the test simple.
      if (game.turn() !== "w") return false;

      let move;
      try {
        move = game.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
      } catch {
        return false;
      }

      playMoveSound(game, move.flags, Boolean(move.captured));
      const next = [...history, move.lan];
      setHistory(next);
      syncBoard();

      if (!game.isGameOver()) void playMaiaReply(next);
      return true;
    },
    [busy, history, playMaiaReply, syncBoard]
  );

  const reset = useCallback(() => {
    clearPendingReply();
    gameRef.current = new Chess();
    setHistory([]);
    setStatus(null);
    setBusy(false);
    setFen(gameRef.current.fen());
    soundManager.playButtonClick();
  }, [clearPendingReply]);

  /** Takes back the full move pair so it is the human's turn again. */
  const undo = useCallback(() => {
    clearPendingReply();
    const game = gameRef.current;
    game.undo();
    game.undo();
    setHistory((prev) => prev.slice(0, Math.max(0, prev.length - 2)));
    setStatus(null);
    setBusy(false);
    setFen(game.fen());
  }, [clearPendingReply]);

  const onStrengthChange = useCallback(
    (nextElo: number) => {
      setElo(nextElo);
      // Mid-game strength changes would make the game meaningless to judge.
      reset();
    },
    [reset]
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
      <div className="flex-1 max-w-[640px] mx-auto w-full">
        <ThemedChessboard
          options={{
            position: fen,
            onPieceDrop: onDrop,
            allowDragging: !busy && !gameRef.current.isGameOver(),
          }}
        />
      </div>

      <aside className="w-full lg:w-72 flex flex-col gap-5">
        <div>
          <h1 className="font-display text-2xl text-brand-text">Maia-3</h1>
          <p className="text-sm text-brand-secondary mt-1">
            Predicts what a human of a given rating would play. You are White.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-secondary mb-2">
            Opponent strength
          </label>
          <div className="grid grid-cols-2 gap-2">
            {STRENGTHS.map((s) => (
              <button
                key={s.elo}
                onClick={() => onStrengthChange(s.elo)}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  elo === s.elo
                    ? "bg-brand-accent/15 text-brand-accent font-medium border border-brand-accent/40"
                    : "text-brand-text hover:bg-white/5 border border-transparent"
                }`}
              >
                {s.name}
                <span className="block text-xs opacity-60">{s.elo}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-brand-secondary mt-2">
            Changing strength starts a new game.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm border border-brand-accent/30 text-brand-text hover:bg-white/5"
          >
            <RotateCcw className="w-4 h-4" /> New game
          </button>
          <button
            onClick={undo}
            disabled={history.length < 2 || busy}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm border border-brand-accent/30 text-brand-text hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none"
          >
            <CornerUpLeft className="w-4 h-4" /> Take back
          </button>
        </div>

        <div className="min-h-[3rem] text-sm">
          {isThinking || busy ? (
            <span className="flex items-center gap-2 text-brand-secondary">
              <Loader2 className="w-4 h-4 animate-spin" /> Maia is thinking…
            </span>
          ) : null}
          {status ? <p className="text-brand-accent font-medium">{status}</p> : null}
          {error ? (
            <p className="flex items-start gap-2 text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </p>
          ) : null}
        </div>

        <div className="text-xs text-brand-secondary">
          Moves: {history.length}
        </div>
      </aside>
    </div>
  );
}
