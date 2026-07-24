import React, { useState, useEffect, useRef } from "react";
import { LogOut, Settings, Palette, Volume2, VolumeX } from "lucide-react";
import { useSession } from "../hooks/useSession";
import { useNavigate } from "react-router";
import { soundManager } from "../utils/SoundManager";

const STORAGE_KEY = 'sound-enabled';

export const AvatarDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { session, signOut } = useSession();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // ── Sound state (mirrors SoundToggle logic so they stay in sync) ───────────
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setMuted(!next);
    localStorage.setItem(STORAGE_KEY, String(next));
    if (next) soundManager.playButtonClick();
    // do NOT close the menu on sound toggle
  };

  // Toggle dropdown visibility
  const toggleDropdown = () => setIsOpen((prev) => !prev);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Listen for Escape key to close dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!session || !session.user) return null;

  const user = session.user;
  const initial = user.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <div ref={dropdownRef} className="relative z-[90]">
      {/* Avatar Button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border border-brand-accent/40 hover:border-brand-accent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 cursor-pointer"
        aria-label="User menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User Avatar"}
            className="w-full h-full object-cover"
            draggable={false}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-surface text-brand-accent font-sans font-bold text-sm select-none">
            {initial}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-brand-surface border border-brand-border rounded-xl shadow-xl shadow-brand-bg/60 py-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150"
          role="menu"
          aria-label="User options"
        >
          {/* User Meta header */}
          <div className="px-4 py-2 border-b border-brand-border/40 mb-1">
            <p className="text-xs font-sans font-semibold text-white truncate">
              {user.name || "User Profile"}
            </p>
            <p className="text-[10px] font-sans text-brand-secondary truncate">
              {user.email || ""}
            </p>
          </div>

          

          {/* ── Settings ──────────────────────────────────────────────────── */}
          <button
            id="avatar-menu-settings"
            role="menuitem"
            onClick={() => { setIsOpen(false); navigate('/settings'); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-brand-secondary hover:text-white hover:bg-white/[0.06] text-left transition-colors duration-150 cursor-pointer group"
            tabIndex={0}
          >
            <Settings className="w-4 h-4 text-brand-accent/70 group-hover:text-brand-accent shrink-0 transition-colors duration-150" />
            <span className="flex-1">Settings</span>
          </button>

          {/* ── Theme — disabled / coming soon ───────────────────────────── */}
          <div
            id="avatar-menu-theme"
            role="menuitem"
            aria-disabled="true"
            title="Coming Soon"
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-brand-secondary/40 text-left cursor-not-allowed select-none opacity-50"
          >
            <Palette className="w-4 h-4 text-brand-accent/30 shrink-0" />
            <span className="flex-1">Theme</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-brand-border/30 text-brand-secondary/40 bg-white/[0.03]">
              Soon
            </span>
          </div>

          {/* ── Sound — full-row button ────────────────────────────────────── */}
          <button
            id="avatar-menu-sound"
            role="menuitem"
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-brand-secondary hover:text-white hover:bg-white/[0.06] text-left transition-colors duration-150 cursor-pointer group"
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
                  : 'border-brand-border/40 text-brand-secondary/50 bg-white/5',
              ].join(' ')}
            >
              {soundEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          <div className="my-1.5 border-t border-brand-border/40" role="separator" />

          {/* Sign Out option */}
          <button
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-sans text-brand-secondary hover:text-red-400 hover:bg-red-500/10 text-left transition-colors duration-150 cursor-pointer"
            role="menuitem"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            Sign Out
          </button>

        </div>
      )}
    </div>
  );
};
