import { useContext } from "react";
import { GameSessionContext } from "../context/gameSessionContext.instance";
import type { GameSessionContextType } from "../context/gameSessionContext.instance";

export function useGameSession(): GameSessionContextType {
  const context = useContext(GameSessionContext);
  if (context === undefined) {
    throw new Error("useGameSession must be used within a GameSessionProvider");
  }
  return context;
}
