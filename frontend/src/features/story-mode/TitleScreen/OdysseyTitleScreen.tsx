import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { SaveProfileScreen } from './SaveProfileScreen';
import { SettingsButton } from './SettingsButton';
import { PatchNotesButton } from './PatchNotesButton';
import { useStoryModeRun } from '../StoryModeContext';
import { useSession } from '@/features/account/useSession';
import { GuestWarningModal } from './GuestWarningModal';

interface StarProps {
  id: number;
  left: string;
  top: string;
  size: string;
  opacity: string;
  duration: string;
  delay: string;
}

interface OdysseyTitleScreenProps {
  onStartSingleplayer: () => void;
}

export function OdysseyTitleScreen({ onStartSingleplayer }: OdysseyTitleScreenProps) {
  const [stars, setStars] = useState<StarProps[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  
  const { activeSlot, setActiveSlot, getAllProfiles, deleteProfile } = useStoryModeRun();
  const profiles = getAllProfiles();
  
  const navigate = useNavigate();

  useEffect(() => {
    const generateStars = () => {
      const newStars: StarProps[] = [];
      const count = 78;
      for (let i = 0; i < count; i++) {
        newStars.push({
          id: i,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 43}%`,
          size: `${1 + Math.random() * 2.4}px`,
          opacity: `${0.35 + Math.random() * 0.65}`,
          duration: `${2.2 + Math.random() * 4.5}s`,
          delay: `${-Math.random() * 5}s`,
        });
      }
      setStars(newStars);
    };

    generateStars();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(generateStars, 160);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const { status, signIn } = useSession();
  const [activeItem, setActiveItem] = useState<number | null>(0); // 0 = Singleplayer
  const [showGuestWarning, setShowGuestWarning] = useState(false);

  const handleStart = () => {
    if (isStarting) return;
    
    if (status === 'unauthenticated') {
      setShowGuestWarning(true);
      return;
    }

    startRun();
  };

  const startRun = () => {
    setIsStarting(true);
    // Let the button scaling animation play out before transitioning
    setTimeout(() => {
      onStartSingleplayer();
    }, 200);
  };

  const activeProfile = profiles.find(p => p.id === activeSlot) || profiles[0];

  return (
    <>
      <style>
        {`
          .cloud-a {
            background-image: radial-gradient(ellipse at 15% 50%, rgba(150, 185, 215, 0.42) 0 18%, transparent 45%),
              radial-gradient(ellipse at 45% 52%, rgba(150, 185, 215, 0.32) 0 17%, transparent 43%),
              radial-gradient(ellipse at 75% 48%, rgba(150, 185, 215, 0.35) 0 18%, transparent 45%);
            animation: cloudDrift 58s linear infinite;
          }
          .cloud-b {
            background-image: radial-gradient(ellipse at 20% 55%, rgba(110, 150, 180, 0.26) 0 20%, transparent 48%),
              radial-gradient(ellipse at 58% 50%, rgba(110, 150, 180, 0.24) 0 16%, transparent 44%);
            animation: cloudDriftReverse 82s linear infinite;
            opacity: 0.07;
          }
          @keyframes twinkle {
            0%, 100% { opacity: calc(var(--opacity) * 0.25); transform: scale(0.75); }
            50% { opacity: var(--opacity); transform: scale(1.45); }
          }
          @keyframes cloudDrift {
            from { transform: translateX(-7%); }
            to { transform: translateX(7%); }
          }
          @keyframes cloudDriftReverse {
            from { transform: translateX(7%); }
            to { transform: translateX(-7%); }
          }
          @keyframes logoFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          .menu-item-scale {
            transform: scale(var(--scale));
          }
          @media (prefers-reduced-motion: reduce) {
            .star, .cloud-a, .cloud-b, .logo-anim { animation: none !important; }
            .menu-item, .wing { transition: none !important; }
          }
        `}
      </style>
      <main className="absolute inset-0 w-full h-full min-h-[640px] max-[600px]:min-h-[720px] overflow-hidden isolate text-[#fff7dd] bg-[#03101c] font-['Georgia','Times_New_Roman',serif] z-50">
        <div className="absolute inset-0 -z-[4] bg-[linear-gradient(rgba(1,8,15,0.04),rgba(1,8,15,0.12)),url('/odyssey-background.jpg')] bg-center max-[900px]:bg-[60%_center] max-[600px]:bg-[55%_center] bg-cover max-[600px]:bg-[length:auto_100%] bg-no-repeat scale-[1.01]"></div>
        <div className="absolute inset-0 -z-[2] pointer-events-none opacity-10 mix-blend-screen bg-repeat-x bg-[length:70%_36%] blur-[14px] ![background-position-y:8%] cloud-a"></div>
        <div className="absolute inset-0 -z-[2] pointer-events-none opacity-10 mix-blend-screen bg-repeat-x bg-[length:70%_36%] blur-[14px] ![background-position-y:8%] cloud-b"></div>
        <div className="absolute inset-0 -z-[1] pointer-events-none overflow-hidden" aria-hidden="true">
          {stars.map((star) => (
            <span
              key={star.id}
              className="absolute rounded-full bg-[rgba(214,240,255,0.95)] shadow-[0_0_7px_rgba(160,220,255,0.65)] animate-[twinkle_var(--duration)_ease-in-out_infinite] star"
              style={{
                left: star.left,
                top: star.top,
                width: 'var(--size)',
                height: 'var(--size)',
                '--size': star.size,
                '--opacity': star.opacity,
                '--duration': star.duration,
                '--delay': star.delay,
                animationDelay: star.delay
              } as React.CSSProperties}
            ></span>
          ))}
        </div>

        <section className="absolute left-1/2 top-[17%] max-[900px]:top-[14%] max-[600px]:top-[16%] min-[700px]:max-[720px]:top-[9%] -translate-x-1/2 w-[min(620px,86vw)] max-[600px]:w-[94vw] text-center" aria-label="Main menu">
          <h1 className="m-[0_0_clamp(44px,8vh,88px)] max-[900px]:mb-[52px] max-[600px]:mb-[52px] min-[700px]:max-[720px]:mb-[34px] text-[clamp(72px,10vw,150px)] max-[600px]:text-[clamp(62px,18vw,92px)] min-[700px]:max-[720px]:text-[clamp(62px,8vw,110px)] leading-[0.9] tracking-[-0.035em] font-bold text-[#e7b64b] [text-shadow:0_3px_0_#7d4e13,0_6px_0_#3d260a,0_10px_24px_rgba(0,0,0,0.7)] animate-[logoFloat_5.5s_ease-in-out_infinite] logo-anim">Odyssey</h1>
          <nav className="flex flex-col items-center gap-[clamp(8px,1.25vh,16px)] max-[600px]:gap-[12px] min-[700px]:max-[720px]:gap-[6px]">
            {[
              { label: 'Singleplayer', action: handleStart },
              { label: 'Multiplayer', disabled: true },
              { label: 'Compendium', disabled: true },
              { label: 'Back', action: () => navigate('/') },
            ].map((item, index) => {
              const isActive = activeItem === index && !item.disabled;
              return (
                <button
                  key={index}
                  disabled={item.disabled}
                  className={`group relative min-w-[310px] max-[900px]:min-w-[270px] max-[600px]:min-w-[240px] border-0 p-[3px_56px] max-[600px]:px-[42px] bg-transparent text-[#f7ecd3] hover:text-[#f2c74f] focus-visible:text-[#f2c74f] text-[clamp(25px,2.2vw,38px)] max-[900px]:text-[clamp(24px,4vw,32px)] max-[600px]:text-[clamp(23px,7vw,31px)] min-[700px]:max-[720px]:text-[clamp(22px,2vw,31px)] font-inherit font-bold [text-shadow:0_2px_0_#0a0a0a,0_4px_7px_rgba(0,0,0,0.65)] hover:[text-shadow:0_2px_0_#0a0a0a,0_0_12px_rgba(245,197,76,0.35)] focus-visible:[text-shadow:0_2px_0_#0a0a0a,0_0_12px_rgba(245,197,76,0.35)] cursor-pointer transition-[transform,color,text-shadow] duration-200 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1),ease,ease] menu-item menu-item-scale focus-visible:outline-none ${isActive ? 'text-[#f2c74f] [text-shadow:0_2px_0_#0a0a0a,0_0_12px_rgba(245,197,76,0.35)] [--scale:1.08]' : '[--scale:1] hover:[--scale:1.08] focus-visible:[--scale:1.08]'} ${item.disabled ? 'opacity-50 cursor-not-allowed text-[#a09e9e] hover:text-[#a09e9e]' : ''}`}
                  onMouseEnter={() => !item.disabled && setActiveItem(index)}
                  onFocus={() => !item.disabled && setActiveItem(index)}
                  onClick={item.action}
                >
                  {!item.disabled && <span className={`absolute top-1/2 left-[7px] text-[#e7b64b] text-[0.82em] -translate-y-1/2 scale-75 [text-shadow:0_0_12px_rgba(235,184,75,0.7)] transition-[opacity,transform] duration-[0.18s,0.24s] [transition-timing-function:ease,cubic-bezier(0.2,0.8,0.2,1)] wing ${isActive ? 'opacity-100 -translate-x-[4px] scale-100' : 'opacity-0 group-hover:opacity-100 group-hover:-translate-x-[4px] group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:-translate-x-[4px] group-focus-visible:scale-100'}`}>✦</span>}
                  <span className="label">{item.label}</span>
                  {!item.disabled && <span className={`absolute top-1/2 right-[7px] text-[#e7b64b] text-[0.82em] -translate-y-1/2 scale-75 [text-shadow:0_0_12px_rgba(235,184,75,0.7)] transition-[opacity,transform] duration-[0.18s,0.24s] [transition-timing-function:ease,cubic-bezier(0.2,0.8,0.2,1)] wing ${isActive ? 'opacity-100 translate-x-[4px] scale-100' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-[4px] group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:translate-x-[4px] group-focus-visible:scale-100'}`}>✦</span>}
                </button>
              );
            })}
          </nav>
        </section>

        {/* Floating Action Icons */}
        <div className="absolute bottom-6 right-6 flex items-center gap-4 z-50">
          <PatchNotesButton />
          <SettingsButton />
        </div>

        <div 
          className="absolute z-[4] text-[#f4cc52] [text-shadow:0_2px_3px_rgba(0,0,0,0.9)] font-bold top-[12px] left-[16px] text-[clamp(16px,1.3vw,23px)] max-[600px]:text-[14px] flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform"
          onClick={() => setShowProfileScreen(true)}
        >
          <div className="w-12 h-12 rounded-lg shadow-lg overflow-hidden flex items-center justify-center bg-black/40">
            <img src={`/save-${activeProfile.icon}.jpg`} alt={`Profile ${activeProfile.id}`} className={`w-full h-full object-cover ${activeProfile.icon === 'green' ? 'scale-110' : ''}`} style={{ clipPath: 'polygon(15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%, 0 15%)' }} />
          </div>
          <div>
            {activeProfile.title}<br />
            <span className="text-[#9ddfff] hover:underline text-[0.8em] font-normal">Click to edit</span>
          </div>
        </div>

        {showProfileScreen && (
          <div className="absolute inset-0 z-[100]">
            <SaveProfileScreen 
              profiles={profiles}
              activeSlot={activeSlot}
              onBack={() => setShowProfileScreen(false)} 
              onSelectProfile={(id) => {
                setActiveSlot(id);
                setShowProfileScreen(false);
              }} 
              onDeleteProfile={(id) => {
                deleteProfile(id);
              }}
            />
          </div>
        )}

        <div className="absolute z-[4] text-[#f4cc52] [text-shadow:0_2px_3px_rgba(0,0,0,0.9)] font-bold top-[12px] right-[18px] text-right text-[12px] opacity-60 max-[600px]:text-[10px]">
          v1.0.0
        </div>

        <GuestWarningModal 
          open={showGuestWarning} 
          onCancel={() => setShowGuestWarning(false)}
          onContinueGuest={() => {
            setShowGuestWarning(false);
            startRun();
          }}
          onSignIn={() => {
            signIn();
            setShowGuestWarning(false);
          }}
        />
      </main>
    </>
  );
}
