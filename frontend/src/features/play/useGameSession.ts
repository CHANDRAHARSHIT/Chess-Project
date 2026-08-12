import { useContext } from "react";
import { GameSessionContext } from "@/features/play/gameSessionContext.instance";
import type { GameSessionContextType } from "@/features/play/gameSessionContext.instance";

export function useGameSession(): GameSessionContextType {
  const context = useContext(GameSessionContext);
  if (context === undefined) {
    throw new Error("useGameSession must be used within a GameSessionProvider");
  }
  return context;
}
