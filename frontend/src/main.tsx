import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { soundManager } from "@/shared/lib/SoundManager";
import { SessionProvider } from "./context/SessionContext";
import { BoardSettingsProvider } from "@/shared/appearance/BoardSettingsContext";
import { NavigationStackProvider } from "./context/NavigationStackContext";
import { MatchmakingProvider } from "./context/MatchmakingContext";
import { GameSessionProvider } from "./context/GameSessionContext";
import ScrollToTop from "./components/ScrollToTop";
import RollbarFallback from "@/shared/ui/RollbarFallback";
import { Provider as RollbarProvider, ErrorBoundary } from "@rollbar/react";
import { ThemeProvider } from "@/shared/appearance/ThemeContext";
import rollbar from "@/shared/lib/rollbar";

// Restore the user's saved sound preference before the first render.
// This ensures no sounds fire in the wrong mute state during startup.
soundManager.initFromStorage();

// Guard against third-party libraries (e.g. react-chessboard) calling preventDefault()
// on non-cancelable touch events, which causes Chrome to log [Intervention] warnings.
if (typeof window !== "undefined") {
  const nativePreventDefault = Event.prototype.preventDefault;
  Event.prototype.preventDefault = function (this: Event) {
    if (!this.cancelable && (this.type === "touchend" || this.type === "touchmove" || this.type === "touchstart")) {
      return;
    }
    return nativePreventDefault.apply(this);
  };
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RollbarProvider instance={rollbar}>
      <ErrorBoundary fallbackUI={RollbarFallback}>
        <BrowserRouter>
          <ScrollToTop />
          <SessionProvider>
            <MatchmakingProvider>
              <GameSessionProvider>
                <BoardSettingsProvider>
                  <ThemeProvider>
                    <NavigationStackProvider>
                      <App />
                    </NavigationStackProvider>
                  </ThemeProvider>
                </BoardSettingsProvider>
              </GameSessionProvider>
            </MatchmakingProvider>
          </SessionProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </RollbarProvider>
  </StrictMode>,
);
