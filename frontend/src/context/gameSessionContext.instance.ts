/**
 * gameSessionContext.instance.ts
 * The Context object and its type live here, separate from the provider component in
 * GameSessionContext.tsx, so that file can export only a component (react-refresh/
 * only-export-components requires a component-only file for Fast Refresh to work).
 */
import { createContext } from "react";
import type { MatchDescriptor, GameResult, StateUpdatePayload } from "../types/multiplayer";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";

export interface MoveRejection {
  reason: string;
  id: number;
}

export interface GameSessionContextType {
  descriptor: MatchDescriptor | null;
  connectionStatus: ConnectionStatus;
  sessionState: StateUpdatePayload | null;
  presence: Record<string, boolean>;
  gameResult: GameResult | null;
  moveRejection: MoveRejection | null;
  mySide: number | null;
  opponentUserId: string | null;
  startGame: (descriptor: MatchDescriptor) => void;
  submitMove: (from: string, to: string, promotion?: string) => void;
  resign: () => void;
  leaveGame: () => void;
  clearMoveRejection: () => void;
}

export const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined);
