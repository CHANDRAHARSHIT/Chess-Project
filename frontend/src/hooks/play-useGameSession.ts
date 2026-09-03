import { useContext } from "react";
import { GameSessionContext } from "@/contexts/play-gameSessionContext.instance";
import type { GameSessionContextType } from "@/contexts/play-gameSessionContext.instance";

export function useGameSession(): GameSessionContextType {
  const context = useContext(GameSessionContext);
  if (context === undefined) {
    throw new Error("useGameSession must be used within a GameSessionProvider");
  }
  return context;
}
