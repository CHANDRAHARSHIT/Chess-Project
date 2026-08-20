import React, { useEffect, useState } from 'react';
import styles from './OdysseyTitleScreen.module.css';
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
    <main className={styles.menuScreen}>
      <div className={styles.bg}></div>
      <div className={`${styles.cloudLayer} ${styles.cloudA}`}></div>
      <div className={`${styles.cloudLayer} ${styles.cloudB}`}></div>
      <div className={styles.starLayer} aria-hidden="true">
        {stars.map((star) => (
          <span
            key={star.id}
            className={styles.star}
            style={
              {
                left: star.left,
                top: star.top,
                '--size': star.size,
                '--opacity': star.opacity,
                '--duration': star.duration,
                '--delay': star.delay,
              } as React.CSSProperties
            }
          ></span>
        ))}
      </div>

      <section className={styles.menuShell} aria-label="Main menu">
        <h1 className={styles.logo}>Odyssey</h1>
        <nav className={styles.menu}>
          {[
            { label: 'Singleplayer', action: handleStart },
            { label: 'Multiplayer', disabled: true },
            { label: 'Compendium', disabled: true },
            { label: 'Back', action: () => navigate('/') },
          ].map((item, index) => (
            <button
              key={index}
              disabled={item.disabled}
              className={`${styles.menuItem} ${activeItem === index && !item.disabled ? styles.menuItemActive : ''} ${item.disabled ? 'opacity-50 cursor-not-allowed text-[#a09e9e] hover:text-[#a09e9e]' : ''}`}
              onMouseEnter={() => !item.disabled && setActiveItem(index)}
              onFocus={() => !item.disabled && setActiveItem(index)}
              onClick={item.action}
            >
              {!item.disabled && <span className={`${styles.wing} ${styles.wingLeft}`}>✦</span>}
              <span className="label">{item.label}</span>
              {!item.disabled && <span className={`${styles.wing} ${styles.wingRight}`}>✦</span>}
            </button>
          ))}
        </nav>
      </section>

      {/* Floating Action Icons */}
      <div className="absolute bottom-6 right-6 flex items-center gap-4 z-50">
        <PatchNotesButton />
        <SettingsButton />
      </div>

      <div 
        className={`${styles.cornerNote} flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform z-50`}
        onClick={() => setShowProfileScreen(true)}
      >
        <div className="w-12 h-12 rounded-lg shadow-lg overflow-hidden flex items-center justify-center bg-black/40">
          <img src={`/save-${activeProfile.icon}.jpg`} alt={`Profile ${activeProfile.id}`} className={`w-full h-full object-cover ${activeProfile.icon === 'green' ? 'scale-110' : ''}`} style={{ clipPath: 'polygon(15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%, 0 15%)' }} />
        </div>
        <div>
          {activeProfile.title}<br />
          <span className="text-[#9ddfff] hover:underline">Click to edit</span>
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
  );
}
