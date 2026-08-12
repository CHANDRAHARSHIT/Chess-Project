/**
 * matchmakingContext.instance.ts
 * The Context object and its type live here, separate from the provider component in
 * MatchmakingContext.tsx, so that file can export only a component (react-refresh/
 * only-export-components requires a component-only file for Fast Refresh to work).
 */
import { createContext } from "react";
import type { MatchDescriptor, MatchTicket } from "@/types/multiplayer";

export type QueuePhase = "idle" | "searching" | "found" | "expired" | "cancelled" | "error" | "unavailable";

export interface MatchmakingContextType {
  phase: QueuePhase;
  ticket: MatchTicket | null;
  descriptor: MatchDescriptor | null;
  errorMessage: string | null;
  findGame: () => Promise<void>;
  cancelSearch: () => Promise<void>;
  consumeMatch: () => void;
  resetToIdle: () => void;
}

export const MatchmakingContext = createContext<MatchmakingContextType | undefined>(undefined);
