/**
 * MoreMenu.tsx
 *
 * A three-dot (⋮) dropdown that sits in the top-right header area.
 *
 * Menu items:
 *   Settings  → navigates to /settings (Board & Pieces, etc.)
 *   Theme     → beautiful animated theme toggler with waveform ripple
 *   ─── divider ───
 *   Sound     → full-row clickable toggle (reuses SoundManager, no SoundToggle sub-button)
 *
 * Accessibility:
 *   - role="menu" / role="menuitem" throughout
 *   - aria-expanded / aria-haspopup on trigger
 *   - Closes on Escape, outside click, and after item selection
 */

import { useState, useEffect, useRef } from 'react';
import { MoreVertical, Settings, Palette, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router';
import { soundManager } from '@/shared/lib/SoundManager';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';

const STORAGE_KEY = 'sound-enabled';

// ─── Component ────────────────────────────────────────────────────────────────

export const MoreMenu: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Sound state (mirrors SoundToggle logic so they stay in sync) ───────────
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setMuted(!next);
    localStorage.setItem(STORAGE_KEY, String(next));
    if (next) soundManager.playButtonClick();
    // do NOT close the menu on sound toggle
  };

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Close on Escape ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative z-[90]">
      {/* ── Trigger button ──────────────────────────────────────────────── */}
      <button
        id="more-menu-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="More options"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="more-menu-dropdown"
        className={[
          'flex items-center justify-center',
          'w-9 h-9 rounded-lg',
          'border transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-brand-accent/40',
          'cursor-pointer',
          isOpen
            ? 'border-[rgba(212,175,110,0.60)] bg-brand-text/[0.08] text-brand-text'
            : 'border-transparent text-brand-secondary hover:text-brand-text hover:border-[rgba(212,175,110,0.40)] hover:bg-brand-text/5',
        ].join(' ')}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* ── Dropdown panel ──────────────────────────────────────────────── */}
      {isOpen && (
        <div
          id="more-menu-dropdown"
          role="menu"
          aria-label="More options menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-52 rounded-xl border border-brand-border bg-brand-surface py-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* ── Settings ──────────────────────────────────────────────────── */}
          <button
            id="more-menu-settings"
            role="menuitem"
            onClick={() => { setIsOpen(false); navigate('/settings'); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-brand-secondary hover:text-brand-text hover:bg-brand-text/[0.06] text-left transition-colors duration-150 cursor-pointer group"
            tabIndex={0}
          >
            <Settings className="w-4 h-4 text-brand-accent/70 group-hover:text-brand-accent shrink-0 transition-colors duration-150" />
            <span className="flex-1">Settings</span>
          </button>

          {/* ── Theme — Interactive Toggler with Waveform Animation ──────── */}
          <div
            id="more-menu-theme"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (!target.closest('button')) {
                const btn = e.currentTarget.querySelector('button');
                btn?.click();
              }
            }}
            className="w-full flex items-center justify-between px-4 py-1.5 text-sm font-sans text-brand-secondary hover:text-brand-text hover:bg-brand-text/[0.06] transition-colors duration-150 cursor-pointer group"
          >
            <div className="flex items-center gap-3 select-none">
              <Palette className="w-4 h-4 text-brand-accent/70 group-hover:text-brand-accent shrink-0 transition-colors duration-150" />
              <span>Theme</span>
            </div>
            <ThemeToggle className="w-14 h-7" />
          </div>

          {/* ── Divider ───────────────────────────────────────────────────── */}
          <div className="my-1.5 border-t border-[rgba(212,175,110,0.40)]" role="separator" />

          {/* ── Sound — full-row button ────────────────────────────────────── */}
          <button
            id="more-menu-sound"
            role="menuitem"
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-brand-secondary hover:text-brand-text hover:bg-brand-text/[0.06] text-left transition-colors duration-150 cursor-pointer group"
            tabIndex={0}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-brand-accent/70 group-hover:text-brand-accent shrink-0 transition-colors duration-150" />
            ) : (
              <VolumeX className="w-4 h-4 text-brand-secondary/60 group-hover:text-brand-secondary shrink-0 transition-colors duration-150" />
            )}
            <span className="flex-1">Sound</span>
            {/* Pill indicator */}
            <span
              className={[
                'text-[10px] font-mono px-1.5 py-0.5 rounded-full border transition-colors duration-200',
                soundEnabled
                  ? 'border-brand-accent/40 text-brand-accent bg-brand-accent/10'
                  : 'border-[rgba(212,175,110,0.40)] text-brand-secondary/50 bg-brand-text/5',
              ].join(' ')}
            >
              {soundEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MoreMenu;