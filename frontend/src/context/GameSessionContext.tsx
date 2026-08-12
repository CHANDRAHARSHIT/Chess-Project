/**
 * GameSessionContext.tsx
 *
 * Owns the WebSocket connection to a single live game and mirrors the server's own state —
 * it never becomes a second source of truth. Board position, clock, and session status are
 * all snapshots of the last `state_update`/`game_over` the server sent; this context never
 * computes a game outcome or a clock expiry itself (Session is the sole authority for both).
 *
 * Reconnect: resumeToken + lastReceivedSeq + the match descriptor are mirrored to
 * sessionStorage so a page refresh mid-game can rejoin (there is no HTTP endpoint to
 * rehydrate session state, so the descriptor itself must be cached, not just the token).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "../hooks/useSession";
import rollbar from "../config/rollbar";
import { GameSessionContext } from "./gameSessionContext.instance";
import type { ConnectionStatus } from "./gameSessionContext.instance";
import type {
  MatchDescriptor,
  GameResult,
  StateUpdatePayload,
  PresenceUpdatePayload,
  OutboundMessage,
} from "../types/multiplayer";

const WS_PATH = "/ws";
const STORAGE_KEY = "xlchess.mp.session";
const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 15000];

interface PersistedSession {
  descriptor: MatchDescriptor;
  resumeToken: string | null;
  lastReceivedSeq: number;
}

interface MoveRejection {
  reason: string;
  id: number;
}

function readPersisted(): PersistedSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedSession) : null;
  } catch {
    return null;
  }
}

function writePersisted(state: PersistedSession | null): void {
  try {
    if (state) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode) — reconnect-on-refresh degrades gracefully.
  }
}

export const GameSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useSession();
  const myUserId = session?.user?.id ?? null;

  // Seeded synchronously from sessionStorage so a refresh mid-game renders the game view on
  // the very first paint — no effect needed to "restore" this piece of state (React docs:
  // initialize from an external source via useState's lazy initializer, not an effect).
  const [descriptor, setDescriptor] = useState<MatchDescriptor | null>(() => readPersisted()?.descriptor ?? null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [sessionState, setSessionState] = useState<StateUpdatePayload | null>(null);
  const [presence, setPresence] = useState<Record<string, boolean>>({});
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [moveRejection, setMoveRejection] = useState<MoveRejection | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const resumeTokenRef = useRef<string | null>(null);
  const lastSeqRef = useRef(0);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const intentionalCloseRef = useRef(false);
  const rejectionIdRef = useRef(0);
  const descriptorRef = useRef(descriptor);
  useEffect(() => {
    descriptorRef.current = descriptor;
  }, [descriptor]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const persist = useCallback(() => {
    const d = descriptorRef.current;
    if (!d) {
      writePersisted(null);
      return;
    }
    writePersisted({ descriptor: d, resumeToken: resumeTokenRef.current, lastReceivedSeq: lastSeqRef.current });
  }, []);

  const handleMessage = useCallback(
    (raw: OutboundMessage) => {
      if (typeof raw.seq === "number") lastSeqRef.current = raw.seq;

      switch (raw.type) {
        case "connected": {
          const payload = raw.payload as { connectionId: string; resumeToken: string };
          resumeTokenRef.current = payload.resumeToken;
          setConnectionStatus("connected");
          reconnectAttemptRef.current = 0;
          persist();
          break;
        }
        case "state_update":
          setSessionState(raw.payload as StateUpdatePayload);
          break;
        case "presence_update": {
          const p = raw.payload as PresenceUpdatePayload;
          setPresence((prev) => ({ ...prev, [p.userId]: p.connected }));
          break;
        }
        case "move_rejected": {
          const p = raw.payload as { reason: string };
          rejectionIdRef.current += 1;
          setMoveRejection({ reason: p.reason, id: rejectionIdRef.current });
          break;
        }
        case "game_over":
          setGameResult(raw.payload as GameResult);
          writePersisted(null);
          break;
        case "error":
          rollbar.info("GameSession WS error message", { payload: raw.payload });
          break;
      }
    },
    [persist]
  );

  // A ref indirection lets the reconnect scheduler call "the latest openSocket" without
  // openSocket's own useCallback needing to reference itself (which eslint's hooks/immutability
  // rule flags as an unsafe self-reference — the callback would close over a stale identity).
  const openSocketRef = useRef<(resumeToken: string | null, lastReceivedSeq: number) => void>(() => {});

  const openSocket = useCallback(
    (resumeToken: string | null, lastReceivedSeq: number) => {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${proto}//${window.location.host}${WS_PATH}`);
      wsRef.current = ws;
      setConnectionStatus(resumeToken ? "reconnecting" : "connecting");

      ws.onopen = () => {
        if (resumeToken) {
          ws.send(JSON.stringify({ resumeToken, lastReceivedSeq }));
        } else {
          ws.send(JSON.stringify({}));
        }
      };

      ws.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data) as OutboundMessage;
          handleMessage(parsed);
        } catch (err) {
          rollbar.error(err as Error, { context: "GameSessionContext.onmessage" });
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (intentionalCloseRef.current) return;

        setConnectionStatus("disconnected");
        const attempt = reconnectAttemptRef.current;
        const delay = RECONNECT_DELAYS_MS[Math.min(attempt, RECONNECT_DELAYS_MS.length - 1)];
        reconnectAttemptRef.current += 1;

        clearReconnectTimer();
        reconnectTimerRef.current = window.setTimeout(() => {
          openSocketRef.current(resumeTokenRef.current, lastSeqRef.current);
        }, delay);
      };

      ws.onerror = () => {
        // The subsequent onclose drives reconnect — nothing additional to do here.
      };
    },
    [clearReconnectTimer, handleMessage]
  );

  useEffect(() => {
    openSocketRef.current = openSocket;
  }, [openSocket]);

  const startGame = useCallback(
    (d: MatchDescriptor) => {
      setDescriptor(d);
      setSessionState(null);
      setPresence({});
      setGameResult(null);
      setMoveRejection(null);
      resumeTokenRef.current = null;
      lastSeqRef.current = 0;
      reconnectAttemptRef.current = 0;
      intentionalCloseRef.current = false;
      writePersisted({ descriptor: d, resumeToken: null, lastReceivedSeq: 0 });
      openSocket(null, 0);
    },
    [openSocket]
  );

  const leaveGame = useCallback(() => {
    intentionalCloseRef.current = true;
    clearReconnectTimer();
    wsRef.current?.close(1000, "left");
    wsRef.current = null;
    setDescriptor(null);
    setSessionState(null);
    setPresence({});
    setGameResult(null);
    setMoveRejection(null);
    resumeTokenRef.current = null;
    lastSeqRef.current = 0;
    writePersisted(null);
  }, [clearReconnectTimer]);

  const submitMove = useCallback((from: string, to: string, promotion?: string) => {
    wsRef.current?.send(JSON.stringify({ type: "submit_move", payload: { from, to, promotion } }));
  }, []);

  const resign = useCallback(() => {
    // readyState, not connectionStatus: the latter only flips to "connected" once the
    // "connected" ack round-trips back, lagging the socket's actual sendability by one
    // hop (e.g. mid-reconnect, the socket can already be OPEN while connectionStatus is
    // still "reconnecting"). Sending on a CONNECTING socket throws synchronously; OPEN is
    // the one state where send() is both safe and actually delivered.
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "resign", payload: {} }));
    }
  }, []);

  const clearMoveRejection = useCallback(() => setMoveRejection(null), []);

  // Rejoin a game that was in progress before a refresh. `descriptor` is already seeded from
  // storage above; this effect only performs the imperative reconnect (no setState here).
  useEffect(() => {
    const persisted = readPersisted();
    if (!persisted) return;
    resumeTokenRef.current = persisted.resumeToken;
    lastSeqRef.current = persisted.lastReceivedSeq;
    intentionalCloseRef.current = false;
    openSocketRef.current(persisted.resumeToken, persisted.lastReceivedSeq);
    // Runs once on mount only — reconnecting again on every dependency change would reopen
    // a second socket. openSocketRef is a ref (stable identity), so [] is exhaustive.
  }, []);

  useEffect(() => {
    return () => {
      clearReconnectTimer();
      wsRef.current?.close();
    };
  }, [clearReconnectTimer]);

  const mySide = descriptor?.participants.find((p) => p.userId === myUserId)?.side ?? null;
  const opponentUserId = descriptor?.participants.find((p) => p.userId !== myUserId)?.userId ?? null;

  return (
    <GameSessionContext.Provider
      value={{
        descriptor,
        connectionStatus,
        sessionState,
        presence,
        gameResult,
        moveRejection,
        mySide,
        opponentUserId,
        startGame,
        submitMove,
        resign,
        leaveGame,
        clearMoveRejection,
      }}
    >
      {children}
    </GameSessionContext.Provider>
  );
};
