import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadConfettiCannonPreset } from "@tsparticles/preset-confetti-cannon";
import type { Engine } from "@tsparticles/engine";

const initParticles = async (engine: Engine) => {
  await loadConfettiCannonPreset(engine);
};

export function Confetti() {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <ParticlesProvider init={initParticles}>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
        <Particles
          id="tsparticles-confetti-cannon"
          options={{
            preset: "confettiCannon",
            interactivity: {
              events: {
                onClick: { enable: false },
                onHover: { enable: false },
              },
            },
            emitters: {
              life: {
                count: 1,
                duration: 0.1,
                delay: 0,
              },
              rate: {
                quantity: 150,
                delay: 0,
              },
              position: { x: 50, y: 100 },
            },
            particles: {
              color: {
                value: ["#6366F1", "#818CF8", "#FFD700", "#FFFFFF"]
              }
            }
          }}
        />
      </div>
    </ParticlesProvider>
  );
}
