/**
 * SoundToggle.tsx
 *
 * Reusable speaker-icon button that:
 *   - Reads the saved preference from localStorage on first render
 *   - Syncs the SoundManager singleton (setMuted) on every toggle
 *   - Persists the new preference back to localStorage
 *   - Reflects the current state through two Lucide icons:
 *       Volume2  → sound ON
 *       VolumeX  → sound OFF (muted)
 *
 * Usage:
 *   <SoundToggle />
 *
 * Adding future settings alongside this control:
 *   Wrap multiple controls in a shared <SettingsMenu> or <SettingsPanel> component
 *   and render <SoundToggle /> as one of its children.
 */

import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../utils/SoundManager';

const STORAGE_KEY = 'sound-enabled'; // single source of truth for the key

export default function SoundToggle() {
  // Derive initial state from localStorage; default to false(muted).
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    // Only the explicit string 'true' enables sound.
    return stored === 'true';
  });

  // On first mount, ensure the SoundManager matches the stored preference.
  // This covers the case where the singleton was created before this component
  // rendered (e.g. a sound fired during app startup before the toggle mounted).
  useEffect(() => {
    soundManager.setMuted(!enabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount only

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    soundManager.setMuted(!next);
    localStorage.setItem(STORAGE_KEY, String(next));
    // Play a click confirmation only when turning sound ON (would be silent otherwise)
    if (next) soundManager.playButtonClick();
  };

  return (
    <button
      onClick={toggle}
      aria-label={enabled ? 'Mute sound' : 'Unmute sound'}
      aria-pressed={enabled}
      title={enabled ? 'Sound on — click to mute' : 'Sound muted — click to enable'}
      className={[
        'relative flex items-center justify-center',
        'w-8 h-8 rounded-lg',
        'border transition-all duration-200',
        enabled
          ? 'border-transparent text-brand-secondary hover:text-ivory hover:border-[rgba(212,175,110,0.40)] hover:bg-brand-text/5'
          : 'border-[rgba(212,175,110,0.40)] bg-brand-text/5 text-ivory/60 hover:text-ivory hover:border-[rgba(212,175,110,0.70)]',
      ].join(' ')}
    >
      {enabled ? (
        <Volume2 className="w-4 h-4" />
      ) : (
        <VolumeX className="w-4 h-4" />
      )}
    </button>
  );
}
