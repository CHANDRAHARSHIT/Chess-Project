/**
 * PlayOnlineView.tsx
 *
 * Renders the multiplayer state machine (lobby → match found → live game) as a
 * tab view inside the Play Hub. Extracted verbatim from PlayChessPage.tsx.
 *
 * ARCHITECTURAL INVARIANT: this component must never be mounted unless the user
 * is authenticated. The ProtectedRoute wrapper in PlayHubPage enforces this gate,
 * ensuring the WebSocket connection, MatchmakingContext, and GameSessionContext
 * side-effects are never triggered for unauthenticated users.
 *
 * Zero logic changes from PlayChessPage — all handlers, hooks, and rendering
 * conditions are identical.
 */
import { useState } from "react";
import { useMatchmaking } from "../../hooks/useMatchmaking";
import { useGameSession } from "../../hooks/useGameSession";
import { LobbyView } from "./LobbyView";
import { MatchFoundCard } from "./MatchFoundCard";
import { PlayChessGame } from "./PlayChessGame";

export function PlayOnlineView() {
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
