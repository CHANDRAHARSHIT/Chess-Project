/**
 * PlayChessPage.tsx
 * Thin state-machine shell: lobby -> match found -> live game -> (back to lobby). No route
 * param drives which view renders — there is no GET /api/session/:id to rehydrate from a URL,
 * so state alone decides (M5 plan §6.1). GameSessionContext's own refresh-rehydration means a
 * refresh mid-game lands back on the game view directly, bypassing the lobby.
 */
import { useState } from "react";
import { useMatchmaking } from "../hooks/useMatchmaking";
import { useGameSession } from "../hooks/useGameSession";
import { LobbyView } from "../components/play/LobbyView";
import { MatchFoundCard } from "../components/play/MatchFoundCard";
import { PlayChessGame } from "../components/play/PlayChessGame";

export default function PlayChessPage() {
  const matchmaking = useMatchmaking();
  const gameSession = useGameSession();
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const handleEnterGame = () => {
    if (!matchmaking.descriptor) return;
    gameSession.startGame(matchmaking.descriptor);
    matchmaking.consumeMatch();
  };

  const handleLeave = () => {
    gameSession.leaveGame();
    matchmaking.resetToIdle();
    setHistoryRefreshKey((k) => k + 1);
  };

  const handleFindAnother = () => {
    gameSession.leaveGame();
    matchmaking.resetToIdle();
    setHistoryRefreshKey((k) => k + 1);
    matchmaking.findGame();
  };

  if (gameSession.descriptor) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] p-3 sm:p-4 lg:p-6 bg-gradient-to-b from-brand-bg to-brand-surface/30">
        <PlayChessGame
          key={gameSession.descriptor.matchId}
          onLeave={handleLeave}
          onFindAnother={handleFindAnother}
        />
      </div>
    );
  }

  if (matchmaking.phase === "found" && matchmaking.descriptor) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-brand-bg to-brand-surface/40">
        <MatchFoundCard descriptor={matchmaking.descriptor} onEnter={handleEnterGame} />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-surface/20">
      <LobbyView historyRefreshKey={historyRefreshKey} />
    </div>
  );
}
