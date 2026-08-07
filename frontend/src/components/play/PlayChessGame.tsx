/**
 * PlayChessGame.tsx
 * The live game view: header, player panels, board, move log, action bar,
 * and 3-second match start countdown sync.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Zap, ArrowLeft } from "lucide-react";
import { useGameSession } from "../../hooks/useGameSession";
import { useSession } from "../../hooks/useSession";
import { PlayerPanel } from "./PlayerPanel";
import { MultiplayerBoard, type DerivedMove } from "./MultiplayerBoard";
import { GameActionBar } from "./GameActionBar";
import { ConnectionIndicator, type PresenceState } from "./ConnectionIndicator";
import { ResultRevealModal } from "./ResultRevealModal";
import { LiveRegion } from "./LiveRegion";
import { MoveLog } from "./MoveLog";
import { soundManager } from "../../utils/SoundManager";
import { generateStartingFenFromPositionId } from "../../utils/chess960PositionId";

const WAIT_TOO_LONG_MS = 65_000;

function getActiveSideFromFen(fen: string): number {
  const parts = fen.split(" ");
  return parts[1] === "b" ? 1 : 0;
}

function mapMyConnection(status: string): PresenceState {
  if (status === "connected") return "live";
  if (status === "reconnecting") return "reconnecting";
  if (status === "disconnected") return "offline";
  return "unknown";
}

function mapOpponentPresence(connected: boolean | undefined): PresenceState {
  if (connected === undefined) return "unknown";
  return connected ? "live" : "offline";
}

interface PlayChessGameProps {
  onLeave: () => void;
  onFindAnother: () => void;
}

export function PlayChessGame({ onLeave, onFindAnother }: PlayChessGameProps) {
  const { session } = useSession();
  const myUserId = session?.user?.id ?? null;
  const {
    descriptor,
    connectionStatus,
    sessionState,
    presence,
    gameResult,
    moveRejection,
    mySide,
    opponentUserId,
    submitMove,
    resign,
  } = useGameSession();

  const [moveLog, setMoveLog] = useState<string[]>([]);
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");
  const [waitedTooLong, setWaitedTooLong] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const wasMyTurnRef = useRef(false);

  // 3-second Match Sync Countdown (3... 2... 1... PLAY!)
  const [countdown, setCountdown] = useState<number | null>(3);

  useEffect(() => {
    if (sessionState?.status !== "WAITING") return;
    const t = window.setTimeout(() => setWaitedTooLong(true), WAIT_TOO_LONG_MS);
    return () => window.clearTimeout(t);
  }, [sessionState?.status]);

  const fen = sessionState?.state.fen ?? null;
  const status = sessionState?.status ?? "CREATED";
  const activeSide = fen ? getActiveSideFromFen(fen) : 0;
  const isMyTurn = mySide !== null && activeSide === mySide;
  const isGameActive = status === "READY" || status === "PLAYING";
  // Gated on server status, not a local move counter — a mid-game refresh remounts with an
  // empty local moveLog but a real status of "PLAYING", so this correctly never replays the
  // countdown over an already-live game; it only ever runs during the genuine pre-first-move
  // READY window.
  const activeCountdown = status === "READY" ? countdown : null;
  const interactive = connectionStatus === "connected" && isGameActive && !gameResult && activeCountdown === null;
  const isMatchOngoing = isGameActive && !gameResult;

  const handleBackClick = () => {
    if (isMatchOngoing) {
      setShowLeaveConfirm(true);
    } else {
      onLeave();
    }
  };

  const confirmLeave = () => {
    setShowLeaveConfirm(false);
    onLeave();
  };

  // Run the 3s "get ready" countdown once, the first time this session reaches READY.
  useEffect(() => {
    if (status !== "READY") return;

    let val = 3;
    soundManager.playButtonClick();

    const interval = window.setInterval(() => {
      val -= 1;
      if (val > 0) {
        setCountdown(val);
        soundManager.playButtonClick();
      } else if (val === 0) {
        setCountdown(0);
        soundManager.playMove();
      } else {
        setCountdown(null);
        window.clearInterval(interval);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (isMyTurn && !wasMyTurnRef.current && isGameActive) {
      setPoliteMessage("Your move.");
      document.title = "Your move — XLChess";
    } else if (!isMyTurn && isGameActive) {
      document.title = "Opponent's move — XLChess";
    }
    wasMyTurnRef.current = isMyTurn;
  }, [isMyTurn, isGameActive]);

  useEffect(() => {
    if (gameResult) document.title = "Game over — XLChess";
    return () => {
      document.title = "XLChess - Chess Platform";
    };
  }, [gameResult]);

  const handleMoveApplied = (move: DerivedMove) => {
    setMoveLog((prev) => [...prev, move.san]);
    if (!move.isOwnMove) {
      soundManager.playMove();
      setPoliteMessage(`Opponent played ${move.san}.`);
    }
    if (move.isCheck) {
      soundManager.playCheck();
      setAssertiveMessage("Check.");
    }
  };

  const finalAssertiveMessage = gameResult ? "Game over." : assertiveMessage;
  const historyView = useMemo(() => moveLog, [moveLog]);

  if (!descriptor) return null;

  const clockFor = (side: number) => {
    const fallbackMs = descriptor.timeControl.initialSeconds * 1000;
    const remainingMs = sessionState?.clock.remainingMs[side] ?? fallbackMs;
    const lastMoveAt = sessionState?.clock.lastMoveAt ?? null;
    const isLive = isGameActive && activeSide === side;
    return { remainingMs, lastMoveAt, isLive };
  };

  const positionId =
    typeof descriptor.variantParams.positionId === "number" ? descriptor.variantParams.positionId : 0;
  const fallbackFen = generateStartingFenFromPositionId(positionId);

  const mySideResolved = mySide ?? 0;
  const opponentSide = mySideResolved === 0 ? 1 : 0;
  const myClock = clockFor(mySideResolved);
  const opponentClock = clockFor(opponentSide);
  const boardOrientation = mySideResolved === 1 ? "black" : "white";

  // Opponent display metadata is sourced from the MatchDescriptor (captured at match time);
  // own name/avatar comes from the live session since it can change after the match started.
  const opponentParticipant = descriptor.participants.find((p) => p.userId === opponentUserId);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-3.5 animate-fade-in">
      <LiveRegion politeMessage={politeMessage} assertiveMessage={finalAssertiveMessage} />

      {/* Top Session Bar - Stretches flush across full arena width */}
      <div className="w-full flex items-center justify-between gap-3 px-5 py-3 rounded-xl bg-brand-surface/80 border border-white/10 backdrop-blur-xl shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackClick}
            className="p-1.5 rounded-lg border border-white/10 bg-brand-bg/40 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 transition-all cursor-pointer"
            title="Return to lobby"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-brand-text font-bold">
              Chess960 • {descriptor.timeControl.label}
            </span>
          </div>
        </div>

        <ConnectionIndicator state={mapMyConnection(connectionStatus)} title="Your Connection" />
      </div>

      {status === "WAITING" && !waitedTooLong && (
        <div className="w-full flex items-center gap-3 px-4 py-2 rounded-xl border border-white/10 bg-brand-surface/50 text-brand-secondary text-xs shadow-md">
          <span className="h-2 w-2 rounded-full bg-brand-accent animate-pulse shrink-0" />
          <span>Waiting for your opponent to connect…</span>
        </div>
      )}

      {waitedTooLong && status === "WAITING" && (
        <div className="w-full flex items-center gap-3 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs shadow-md">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>This is taking longer than expected. Your opponent may not be connecting.</span>
          <button onClick={onLeave} className="ml-auto font-mono text-[11px] uppercase tracking-wider underline cursor-pointer">
            Back to Lobby
          </button>
        </div>
      )}

      {/* Main Studio Arena: Board (Left, 450px) + Controls/MoveLog (Right, flex-1) */}
      <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-between gap-5 lg:gap-7">
        {/* Left Column: Opponent Panel, Board with Countdown, Player Panel */}
        <div className="relative flex flex-col items-center justify-center w-full max-w-[450px] lg:w-[450px] shrink-0 gap-2">
          {opponentUserId && (
            <div className="w-full">
              <PlayerPanel
                userId={opponentUserId}
                label="Opponent"
                name={opponentParticipant?.name}
                image={opponentParticipant?.image}
                presenceState={mapOpponentPresence(presence[opponentUserId])}
                {...opponentClock}
              />
            </div>
          )}

          <div
            className={`relative w-full flex justify-center ${
              connectionStatus === "reconnecting" || connectionStatus === "disconnected"
                ? "opacity-60 pointer-events-none"
                : ""
            }`}
          >
            <MultiplayerBoard
              fen={fen ?? fallbackFen}
              boardOrientation={boardOrientation}
              isMyTurn={isMyTurn}
              interactive={interactive}
              moveRejection={moveRejection}
              onSubmitMove={submitMove}
              onMoveApplied={handleMoveApplied}
            />

            {/* 3-Second Match Sync Countdown Overlay */}
            {activeCountdown !== null && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl bg-black/60 backdrop-blur-md animate-fade-in pointer-events-none">
                <span className="font-mono text-xs uppercase tracking-widest text-brand-accent font-bold mb-2">
                  Match Syncing
                </span>
                <div className="text-6xl font-display font-extrabold text-brand-accent animate-bounce drop-shadow-[0_0_25px_rgba(212,175,110,0.6)]">
                  {activeCountdown === 0 ? "PLAY!" : activeCountdown}
                </div>
              </div>
            )}

            {gameResult && myUserId && (
              <ResultRevealModal
                result={gameResult}
                myUserId={myUserId}
                onFindAnother={onFindAnother}
                onBackToLobby={onLeave}
              />
            )}
          </div>

          {myUserId && (
            <div className="w-full">
              <PlayerPanel
                userId={myUserId}
                label="You"
                name={session?.user?.name ?? undefined}
                image={session?.user?.image ?? undefined}
                presenceState={mapMyConnection(connectionStatus)}
                {...myClock}
              />
            </div>
          )}
        </div>

        {/* Right Column: Game Action Controls & Live Move Log (Expands to fill workspace width) */}
        <div className="w-full max-w-[450px] lg:max-w-none lg:flex-1 flex flex-col gap-2 lg:h-[550px] lg:max-h-[550px] shrink-0 min-h-0">
          <GameActionBar canAct={interactive && !gameResult} onResign={resign} />
          <div className="flex-1 min-h-0 overflow-hidden">
            <MoveLog moves={historyView} />
          </div>
        </div>
      </div>

      {showLeaveConfirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="leave-confirm-title"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="max-w-sm w-full rounded-2xl border border-white/10 bg-brand-surface/95 backdrop-blur-xl p-6 space-y-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 id="leave-confirm-title" className="font-display text-lg font-bold text-brand-text">
                Leave ongoing match?
              </h2>
            </div>
            <p className="text-sm text-brand-secondary">
              Going back will terminate the ongoing match. Do you want to proceed?
            </p>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-widest font-semibold border border-brand-border/60 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 bg-brand-bg/40 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmLeave}
                className="px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-widest font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer"
              >
                Leave Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
