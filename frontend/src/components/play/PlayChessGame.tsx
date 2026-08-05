/**
 * PlayChessGame.tsx
 * The live game view: header, both player panels (identity + presence + clock merged into one
 * row — the same layout works stacked-mobile and side-by-side-desktop with zero special-casing),
 * the board, move log, action bar, and the result reveal. All state is read from
 * GameSessionContext — this component owns no game state of its own beyond derived display data.
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
  const wasMyTurnRef = useRef(false);

  useEffect(() => {
    if (sessionState?.status !== "WAITING") return;
    const t = window.setTimeout(() => setWaitedTooLong(true), WAIT_TOO_LONG_MS);
    return () => window.clearTimeout(t);
  }, [sessionState?.status]);

  const fen = sessionState?.state.fen ?? null;
  const status = sessionState?.status ?? "CREATED";
  const activeSide = fen ? getActiveSideFromFen(fen) : 0;
  const isMyTurn = mySide !== null && activeSide === mySide;
  const isPlaying = status === "PLAYING";
  const interactive = connectionStatus === "connected" && (status === "READY" || status === "PLAYING") && !gameResult;

  useEffect(() => {
    if (isMyTurn && !wasMyTurnRef.current && isPlaying) {
      setPoliteMessage("Your move.");
      document.title = "Your move — XLChess";
    } else if (!isMyTurn && isPlaying) {
      document.title = "Opponent's move — XLChess";
    }
    wasMyTurnRef.current = isMyTurn;
  }, [isMyTurn, isPlaying]);

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
    const isLive = isPlaying && activeSide === side;
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

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5 animate-fade-in">
      <LiveRegion politeMessage={politeMessage} assertiveMessage={finalAssertiveMessage} />

      {/* Top Session Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-brand-surface/70 border border-white/10 backdrop-blur-xl shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onLeave}
            className="p-1.5 rounded-lg border border-white/10 bg-brand-bg/40 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 transition-all cursor-pointer"
            title="Return to lobby"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-accent animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-brand-text font-bold">
              Chess 960 • {descriptor.timeControl.label}
            </span>
          </div>
        </div>

        {/* Turn Status Pill */}
        {(status === "READY" || status === "PLAYING") && !gameResult && (
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full border font-mono text-xs uppercase tracking-wider font-semibold transition-all ${
              isMyTurn
                ? "bg-brand-accent/15 border-brand-accent/40 text-brand-accent shadow-[0_0_15px_rgba(212,175,110,0.15)]"
                : "bg-brand-bg/40 border-white/10 text-brand-secondary"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isMyTurn ? "bg-brand-accent animate-ping" : "bg-brand-secondary/40"
              }`}
            />
            {isMyTurn ? "Your Turn" : "Opponent's Turn"}
          </div>
        )}

        <ConnectionIndicator state={mapMyConnection(connectionStatus)} title="Your Connection" />
      </div>

      {waitedTooLong && status === "WAITING" && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm shadow-md">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>This is taking longer than expected. Your opponent may not be connecting.</span>
          <button onClick={onLeave} className="ml-auto font-mono text-xs uppercase tracking-wider underline cursor-pointer">
            Back to Lobby
          </button>
        </div>
      )}

      {/* Main Studio Arena: Board Stack on Left, Controls & Move Log on Right */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-5 lg:gap-8">
        {/* Left Column: Opponent Panel, Board, Player Panel */}
        <div className="relative flex flex-col items-center justify-center w-full max-w-[540px] shrink-0 gap-3">
          {opponentUserId && (
            <div className="w-full">
              <PlayerPanel
                userId={opponentUserId}
                label="Opponent"
                presenceState={mapOpponentPresence(presence[opponentUserId])}
                {...opponentClock}
              />
            </div>
          )}

          <div
            className={`relative w-full ${
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
                presenceState={mapMyConnection(connectionStatus)}
                {...myClock}
              />
            </div>
          )}
        </div>

        {/* Right Column: Game Action Controls & Live Move Log */}
        <div className="w-full max-w-[540px] lg:max-w-xs xl:max-w-sm flex flex-col gap-3 lg:h-[540px] lg:max-h-[540px] shrink-0 min-h-0">
          <GameActionBar canAct={interactive && !gameResult} onResign={resign} />
          <div className="flex-1 min-h-0 overflow-hidden">
            <MoveLog moves={historyView} />
          </div>
        </div>
      </div>
    </div>
  );
}
