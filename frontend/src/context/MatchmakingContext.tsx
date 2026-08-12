/**
 * MatchmakingContext.tsx
 * Queue ticket lifecycle only — enqueue, poll, cancel. Match handoff to GameSessionContext
 * happens once, at the LobbyView/MatchFoundCard boundary (mirrors the backend's own
 * one-way MatchDescriptor handoff).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  MatchmakingService,
  MultiplayerDisabledError,
  TicketNotFoundError,
} from "@/services/matchmaking.service";
import { MatchmakingContext } from "./matchmakingContext.instance";
import type { QueuePhase } from "./matchmakingContext.instance";
import type { MatchDescriptor, MatchTicket } from "@/types/multiplayer";

// 2.5s keeps a single queue session (up to the 60s ticket TTL) well under the backend's
// global rate limit (100 req / 15 min per IP, shared across all /api/* traffic) even with
// two local clients testing against the same machine, while staying imperceptible to the player.
const POLL_INTERVAL_MS = 2500;
const VARIANT_ID = "chess960";

export const MatchmakingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<QueuePhase>("idle");
  const [ticket, setTicket] = useState<MatchTicket | null>(null);
  const [descriptor, setDescriptor] = useState<MatchDescriptor | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollTimerRef = useRef<number | null>(null);

  const clearPoll = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (ticketId: string) => {
      clearPoll();
      pollTimerRef.current = window.setInterval(async () => {
        try {
          const res = await MatchmakingService.getStatus(ticketId);
          setTicket(res.ticket);
          if (res.status === "MATCHED" && res.matchDescriptor) {
            clearPoll();
            setDescriptor(res.matchDescriptor);
            setPhase("found");
          } else if (res.status === "CANCELLED") {
            clearPoll();
            setPhase("cancelled");
          }
        } catch (err) {
          clearPoll();
          if (err instanceof TicketNotFoundError) {
            setPhase("expired");
          } else if (err instanceof MultiplayerDisabledError) {
            setPhase("unavailable");
          } else {
            setErrorMessage((err as Error).message);
            setPhase("error");
          }
        }
      }, POLL_INTERVAL_MS);
    },
    [clearPoll]
  );

  const findGame = useCallback(async () => {
    setErrorMessage(null);
    setDescriptor(null);
    try {
      const res = await MatchmakingService.enqueue(VARIANT_ID);
      setTicket(res.ticket);
      if (res.matched && res.matchDescriptor) {
        setDescriptor(res.matchDescriptor);
        setPhase("found");
      } else {
        setPhase("searching");
        startPolling(res.ticket.ticketId);
      }
    } catch (err) {
      if (err instanceof MultiplayerDisabledError) {
        setPhase("unavailable");
      } else {
        setErrorMessage((err as Error).message);
        setPhase("error");
      }
    }
  }, [startPolling]);

  const cancelSearch = useCallback(async () => {
    clearPoll();
    if (ticket) {
      try {
        await MatchmakingService.cancel(ticket.ticketId);
      } catch {
        // Cancel is best-effort — the ticket's own TTL is the fallback safety net.
      }
    }
    setTicket(null);
    setPhase("idle");
  }, [clearPoll, ticket]);

  const consumeMatch = useCallback(() => {
    clearPoll();
    setTicket(null);
    setDescriptor(null);
    setPhase("idle");
  }, [clearPoll]);

  const resetToIdle = useCallback(() => {
    clearPoll();
    setTicket(null);
    setDescriptor(null);
    setErrorMessage(null);
    setPhase("idle");
  }, [clearPoll]);

  useEffect(() => clearPoll, [clearPoll]);

  return (
    <MatchmakingContext.Provider
      value={{ phase, ticket, descriptor, errorMessage, findGame, cancelSearch, consumeMatch, resetToIdle }}
    >
      {children}
    </MatchmakingContext.Provider>
  );
};
