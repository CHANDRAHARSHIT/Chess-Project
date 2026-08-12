/**
 * App.tsx
 * Root application component.
 * GSAP plugins are registered here via gsapConfig (runs once at module level).
 * The smooth-wrapper / smooth-content divs prepare for ScrollSmoother (Club)
 * and currently drive native CSS smooth scroll.
 *
 * Premium additions:
 *   - PremiumLoader: cinematic rook loader that dissolves into the page
 */

// ── GSAP: register plugins immediately (before any component renders) ──────
import "./utils/gsapConfig";

import AppRouter from "./router/AppRouter";

import { ParticlesProvider } from "@tsparticles/react";
import { loadConfettiCannonPreset } from "@tsparticles/preset-confetti-cannon";
import type { Engine } from "@tsparticles/engine";

const initParticles = async (engine: Engine) => {
  await loadConfettiCannonPreset(engine);
};

function App() {
  return (
    <ParticlesProvider init={initParticles}>
      {/* smooth-wrapper + smooth-content: ScrollSmoother-ready DOM structure. */}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <AppRouter />
        </div>
      </div>
    </ParticlesProvider>
  );
}

export default App;
