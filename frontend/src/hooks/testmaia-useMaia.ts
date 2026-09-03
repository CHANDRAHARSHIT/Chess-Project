/**
 * Client for the Maia-3 move endpoint.
 *
 * Unlike `useStockfish`, which runs an engine in a Web Worker, Maia is a PyTorch
 * model on the server — every move is a network round trip.
 */

import { useCallback, useRef, useState } from "react";
import rollbar from "@/lib/rollbar";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export interface MaiaMove {
  move: string;
  elo: number;
  latencyMs: number;
}

export function useMaia() {
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * Bumped whenever the board is reset or a request is superseded. A response
   * whose id no longer matches is dropped, so a slow move for an abandoned
   * position can never land on the current board.
   */
  const requestIdRef = useRef(0);

  const invalidate = useCallback(() => {
    requestIdRef.current += 1;
    setIsThinking(false);
  }, []);

  /** Asks Maia for the move a player of `elo` would play. Null if superseded or failed. */
  const getMove = useCallback(async (moves: string[], elo: number): Promise<MaiaMove | null> => {
    const id = ++requestIdRef.current;
    setIsThinking(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/maia/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ moves, elo }),
      });

      const body = await res.json();
      if (id !== requestIdRef.current) return null;

      if (!res.ok) {
        setError(body?.message ?? `Maia request failed (${res.status})`);
        return null;
      }
      return body.data as MaiaMove;
    } catch (err) {
      if (id !== requestIdRef.current) return null;
      rollbar.error(err as Error, { context: "useMaia.getMove" });
      setError("Could not reach Maia. Is the server running with MAIA_ENABLED=true?");
      return null;
    } finally {
      if (id === requestIdRef.current) setIsThinking(false);
    }
  }, []);

  return { getMove, isThinking, error, invalidate };
}
