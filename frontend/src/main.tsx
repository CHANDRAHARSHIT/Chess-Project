import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { soundManager } from "./utils/SoundManager";
import { SessionProvider } from "./context/SessionContext";
import { BoardSettingsProvider } from "./context/BoardSettingsContext";
import { NavigationStackProvider } from "./context/NavigationStackContext";
import ScrollToTop from "./components/ScrollToTop";
import RollbarFallback from "./components/RollbarFallback";
import { Provider as RollbarProvider, ErrorBoundary } from "@rollbar/react";
import { ThemeProvider } from "./context/ThemeContext";
import rollbar from "./config/rollbar";

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
            <BoardSettingsProvider>
              <ThemeProvider>
                <NavigationStackProvider>
                  <App />
                </NavigationStackProvider>
              </ThemeProvider>
            </BoardSettingsProvider>
          </SessionProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </RollbarProvider>
  </StrictMode>,
);
