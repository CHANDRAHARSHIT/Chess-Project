import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Heart, Coins, Brain, Check, ArrowLeft, Lock } from "lucide-react";

type StrategistPageProps = {
  onBack: () => void;
  onConfirm: () => void;
};

export function StrategistPage({ onBack, onConfirm }: StrategistPageProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [particles, setParticles] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Generate particles
    const newParticles = [];
    for (let i = 0; i < 34; i++) {
      newParticles.push({
        id: i,
        top: `${Math.random() * 98}%`,
        size: `${2 + Math.random() * 8}px`,
        opacity: `${0.24 + Math.random() * 0.62}`,
        duration: `${9 + Math.random() * 17}s`,
        delay: `${-Math.random() * 19}s`,
        rotate: `${Math.random() * 180}deg`,
      });
    }
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.volume = 0.35;
      const attempt = audioRef.current.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => {
          const unlock = () => {
            if (audioRef.current && soundEnabled) {
              audioRef.current.play().catch(() => {});
            }
            window.removeEventListener("pointerdown", unlock);
            window.removeEventListener("keydown", unlock);
          };
          window.addEventListener("pointerdown", unlock, { once: true });
          window.addEventListener("keydown", unlock, { once: true });
        });
      }
    }
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
    if (audioRef.current) {
      if (soundEnabled) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } else {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    }
  };

  return (
    <>
      <style>{`
        .strat-game-screen {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          min-height: 640px;
          overflow: hidden;
          background: #090712;
          color: #fff7e8;
          font-family: Georgia, "Times New Roman", serif;
          animation: screenShake 0.52s cubic-bezier(.2,.8,.2,1) both;
          z-index: 100;
        }

        .strat-background-layer,
        .strat-character-breath {
          position: absolute;
          inset: 0;
          background-image: url("/assets/strategist/strategist-background.png");
          background-repeat: no-repeat;
          background-position: center center;
          background-size: cover;
        }

        .strat-background-layer {
          filter: saturate(0.95) brightness(0.98);
        }

        .strat-character-breath {
          clip-path: polygon(48% 0, 100% 0, 100% 100%, 45% 100%, 52% 67%, 55% 37%);
          transform-origin: 76% 76%;
          animation: strat-breathe 6.8s ease-in-out infinite;
          pointer-events: none;
        }

        .strat-background-layer::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 68% 52%, transparent 0 24%, rgba(5, 3, 10, .14) 58%, rgba(4, 3, 9, .42) 100%),
            linear-gradient(90deg, rgba(7, 5, 13, .16), transparent 55%);
          pointer-events: none;
        }

        .strat-info-panel {
          position: absolute;
          left: 11.3vw;
          top: 28vh;
          width: min(34vw, 560px);
          padding: 28px 34px 30px;
          background: linear-gradient(90deg, rgba(7, 5, 11, .76), rgba(10, 6, 14, .58));
          border-radius: 4px;
          box-shadow: 0 16px 40px rgba(0,0,0,.25);
          backdrop-filter: blur(1px);
          z-index: 5;
        }

        .strat-info-panel h1 {
          margin: 0 0 10px;
          color: #f3c64a;
          font-size: clamp(38px, 4vw, 72px);
          line-height: .95;
          text-shadow: 0 3px 0 #321c05, 0 0 18px rgba(228, 169, 42, .16);
          font-weight: normal;
        }

        .strat-stats {
          display: flex;
          gap: 36px;
          margin: 17px 0 12px;
          font-size: clamp(21px, 1.55vw, 30px);
        }
        
        .strat-stats span {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .strat-health {
          color: #ff565c;
        }

        .strat-gold {
          color: #f6c431;
        }

        .strat-description {
          margin: 0 0 20px;
          font-size: clamp(17px, 1.25vw, 24px);
          line-height: 1.35;
          text-shadow: 0 2px 2px rgba(0,0,0,.8);
        }

        .strat-ability {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .strat-ability-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          flex: 0 0 52px;
          border: 3px solid #8852b7;
          border-radius: 50%;
          color: #c28aff;
          background: rgba(58, 29, 81, .68);
          font-size: 24px;
        }

        .strat-ability h2 {
          margin: 0;
          color: #f2c449;
          font-size: clamp(19px, 1.35vw, 27px);
          font-weight: normal;
        }

        .strat-ability p {
          margin: 4px 0 0;
          font-size: clamp(16px, 1.15vw, 22px);
        }

        .strat-ability p span {
          color: #90ed55;
          font-weight: 700;
        }

        .strat-portraits {
          position: absolute;
          z-index: 10;
          bottom: 6.5vh;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
        }

        .strat-portrait {
          width: clamp(68px, 6vw, 100px);
          aspect-ratio: .73;
          display: grid;
          place-items: center;
          border: 2px solid rgba(16, 13, 21, .92);
          border-radius: 4px;
          background: linear-gradient(160deg, rgba(91,83,103,.92), rgba(25,22,32,.96));
          color: #c7b9d1;
          font-size: clamp(24px, 2.5vw, 36px);
          box-shadow: 0 8px 20px rgba(0,0,0,.45);
          cursor: pointer;
          transition: transform .15s ease, filter .15s ease, box-shadow .15s ease;
        }

        .strat-portrait:hover {
          transform: translateY(-5px);
          filter: brightness(1.12);
        }

        .strat-portrait.selected {
          border-color: #a867dc;
          box-shadow: 0 0 0 3px #743ca0, 0 0 18px #a456da, 0 10px 20px rgba(0,0,0,.5);
          color: #f1d4ff;
          background: url('/assets/strategist/strategist_card.jpg') center/cover no-repeat;
        }

        .strat-portrait.locked {
          color: #b7ac93;
          background: rgba(26, 23, 27, .92);
          cursor: not-allowed;
        }
        
        .strat-portrait.locked:hover {
          transform: none;
          filter: none;
        }

        .strat-back-button,
        .strat-confirm-button {
          position: absolute;
          z-index: 10;
          bottom: 18vh;
          border: 0;
          color: #fff4d4;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: transform .15s ease, filter .15s ease;
        }

        .strat-back-button {
          left: 0;
          width: 126px;
          height: 88px;
          background: linear-gradient(#b73128, #8a211c);
          clip-path: polygon(0 0, 100% 0, 83% 50%, 100% 100%, 0 100%);
        }
        
        .strat-back-button svg {
          transform: translateX(-8px);
        }

        .strat-confirm-button {
          right: 0;
          width: 136px;
          height: 88px;
          background: linear-gradient(#24576c, #163b4b);
          clip-path: polygon(17% 0, 100% 0, 100% 100%, 17% 100%, 0 50%);
        }
        
        .strat-confirm-button svg {
          transform: translateX(8px);
        }

        .strat-back-button:hover,
        .strat-confirm-button:hover {
          filter: brightness(1.2);
          transform: scale(1.03);
        }

        .strat-sound-toggle {
          position: absolute;
          z-index: 20;
          left: 22px;
          top: 22px;
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          border: 2px solid #7b5b2b;
          border-radius: 14px;
          background: rgba(33, 26, 19, .86);
          color: #f3c64a;
          cursor: pointer;
          box-shadow: 0 5px 15px rgba(0,0,0,.35);
        }

        .strat-particles {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 2;
        }

        .strat-particle {
          position: absolute;
          left: -4vw;
          width: var(--size);
          height: calc(var(--size) * .45);
          border-radius: 60% 40% 60% 40%;
          background: radial-gradient(circle, #ffd08b 0 10%, #df783a 38%, rgba(176,72,31,.05) 74%);
          box-shadow: 0 0 8px rgba(234, 119, 50, .65);
          opacity: var(--opacity);
          filter: blur(.3px);
          transform: rotate(var(--rotate));
          animation: ashFly var(--duration) linear infinite;
          animation-delay: var(--delay);
        }

        @keyframes ashFly {
          0% {
            transform: translate(-5vw, 6vh) rotate(var(--rotate));
            opacity: 0;
          }
          8% { opacity: var(--opacity); }
          85% { opacity: var(--opacity); }
          100% {
            transform: translate(112vw, -15vh) rotate(calc(var(--rotate) + 220deg));
            opacity: 0;
          }
        }

        @keyframes strat-breathe {
          0%, 100% { transform: translateX(0) translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateX(7px) translateY(-2px) rotate(.18deg) scale(1.004); }
        }

        @keyframes screenShake {
          0% { transform: translate(0,0); filter: brightness(.6); }
          12% { transform: translate(-8px, 4px); }
          24% { transform: translate(7px, -4px); }
          36% { transform: translate(-5px, 3px); }
          48% { transform: translate(4px, -2px); }
          65% { transform: translate(-2px, 1px); }
          100% { transform: translate(0,0); filter: brightness(1); }
        }

        @media (max-width: 900px) {
          .strat-game-screen { min-height: 720px; }

          .strat-info-panel {
            left: 5vw;
            top: 12vh;
            width: min(88vw, 560px);
          }

          .strat-portraits {
            bottom: 6vh;
            gap: 6px;
          }

          .strat-back-button,
          .strat-confirm-button {
            bottom: 18vh;
            width: 88px;
            height: 68px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .strat-game-screen,
          .strat-character-breath,
          .strat-particle {
            animation: none !important;
          }
        }
      `}</style>

      <main className="strat-game-screen">
        <div className="strat-background-layer"></div>
        <div className="strat-character-breath"></div>

        <div className="strat-particles" aria-hidden="true">
          {particles.map((p) => (
            <span
              key={p.id}
              className="strat-particle"
              style={
                {
                  top: p.top,
                  "--size": p.size,
                  "--opacity": p.opacity,
                  "--duration": p.duration,
                  "--delay": p.delay,
                  "--rotate": p.rotate,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <button
          className="strat-sound-toggle"
          onClick={toggleSound}
          aria-label="Toggle sound"
        >
          {soundEnabled ? <Volume2 size={30} /> : <VolumeX size={30} />}
        </button>

        <section className="strat-info-panel">
          <h1>The Strategist</h1>

          <div className="strat-stats">
            <span className="strat-health">
              <Heart size={28} /> <strong>80/80</strong>
            </span>
            <span className="strat-gold">
              <Coins size={28} /> <strong>99</strong>
            </span>
          </div>

          <p className="strat-description">
            A master of foresight and calculation.<br />
            Outmaneuvers enemies before they make a move.
          </p>

          <div className="strat-ability">
            <div className="strat-ability-icon">
              <Brain size={28} />
            </div>
            <div>
              <h2>Calculated Mind</h2>
              <p>
                At the start of combat, draw <span>1</span> card.
              </p>
            </div>
          </div>
        </section>

        <nav className="strat-portraits" aria-label="Character selection">
          <button className="strat-portrait selected" aria-label="The Strategist" />
          <button className="strat-portrait locked" aria-label="Locked character 1">
            <Lock size={30} />
          </button>
          <button className="strat-portrait locked" aria-label="Locked character">
            <Lock size={30} />
          </button>
          <button className="strat-portrait locked" aria-label="Locked character">
            <Lock size={30} />
          </button>
        </nav>

        <button className="strat-back-button" onClick={onBack} aria-label="Back">
          <ArrowLeft size={42} strokeWidth={3} />
        </button>
        <button
          className="strat-confirm-button"
          onClick={onConfirm}
          aria-label="Confirm"
        >
          <Check size={42} strokeWidth={3} />
        </button>

        <audio
          ref={audioRef}
          src="/assets/strategist/entry-chime.wav"
          preload="auto"
        />
      </main>
    </>
  );
}
