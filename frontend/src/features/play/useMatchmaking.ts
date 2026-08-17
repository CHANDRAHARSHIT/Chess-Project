import { useContext } from "react";
import { MatchmakingContext } from "@/features/play/matchmakingContext.instance";
import type { MatchmakingContextType } from "@/features/play/matchmakingContext.instance";

export function useMatchmaking(): MatchmakingContextType {
  const context = useContext(MatchmakingContext);
  if (context === undefined) {
    throw new Error("useMatchmaking must be used within a MatchmakingProvider");
  }
  return context;
}
