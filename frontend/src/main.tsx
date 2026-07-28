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

// Restore the user's saved sound preference before the first render.
// This ensures no sounds fire in the wrong mute state during startup.
soundManager.initFromStorage();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <SessionProvider>
        <BoardSettingsProvider>
          <NavigationStackProvider>
            <App />
          </NavigationStackProvider>
        </BoardSettingsProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
