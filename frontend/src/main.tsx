import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { soundManager } from './utils/SoundManager'
import { SessionProvider } from './context/SessionContext'
import { BoardSettingsProvider } from './context/BoardSettingsContext'
import ScrollToTop from "./components/ScrollToTop";
import { Provider as RollbarProvider, ErrorBoundary } from '@rollbar/react';

// Restore the user's saved sound preference before the first render.
// This ensures no sounds fire in the wrong mute state during startup.
soundManager.initFromStorage();

const rollbarConfig = {
  accessToken: import.meta.env.VITE_ROLLBAR_ACCESS_TOKEN,
  environment: import.meta.env.MODE || 'development',
  captureUncaught: true,
  captureUnhandledRejections: true,
};

const RollbarFallback = () => (
  <div style={{ padding: '20px', color: 'red' }}>
    <h2>Oops, something went wrong.</h2>
    <p>We've been notified and are looking into it.</p>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RollbarProvider config={rollbarConfig}>
      <ErrorBoundary fallbackUI={RollbarFallback}>
        <BrowserRouter>
          <ScrollToTop />
          <SessionProvider>
            <BoardSettingsProvider>
              <App />
            </BoardSettingsProvider>
          </SessionProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </RollbarProvider>
  </StrictMode>,
)
