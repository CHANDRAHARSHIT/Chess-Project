import React, { useState, useEffect, useRef } from "react";
import { LogOut, Settings, Palette, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { ThemeSubmenu } from "./ThemeSubmenu";
import { useAdminSession } from "@/features/admin/useAdminSession";
import { adminSignOut } from "@/features/admin/adminAuth";

export const AdminAvatarDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<"main" | "theme">("main");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { admin } = useAdminSession();

  const displayName = admin?.name ?? admin?.email ?? "";
  const initial = (displayName.trim()[0] ?? "").toUpperCase();

  // Toggle dropdown visibility
  const toggleDropdown = () => setIsOpen((prev) => !prev);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveMenu("main");
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
        setActiveMenu("main");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await adminSignOut();
    navigate("/admin", { replace: true });
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    navigate("/admin/settings");
  };

  return (
    <div ref={dropdownRef} className="relative z-[90]">
      {/* Avatar Button matching img2 */}
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-center w-11 h-11 rounded-full bg-[#3d4b58] border-2 border-[#bfa15f] hover:border-gold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 cursor-pointer shadow-md"
        aria-label="Admin user menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="text-white font-sans font-bold text-lg select-none">
          {initial}
        </span>
      </button>

      {/* Dropdown Menu matching img2 */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 bg-brand-surface border border-brand-border rounded-2xl py-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 font-sans"
          role="menu"
          aria-label="Admin user options"
        >
          {activeMenu === "main" && (
            <>
              {/* User Meta header matching img2 */}
              <div className="px-4 py-2.5 border-b border-[rgba(212,175,110,0.30)] mb-1">
                <p className="text-sm font-semibold text-brand-text truncate">
                  {admin?.name ?? "Admin"}
                </p>
                <p className="text-xs text-brand-secondary truncate mt-0.5">
                  {admin?.email ?? ""}
                </p>
              </div>

              {/* ── Settings ──────────────────────────────────────────────────── */}
              <button
                id="admin-avatar-menu-settings"
                role="menuitem"
                onClick={handleSettingsClick}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-brand-secondary hover:text-brand-text hover:bg-brand-text/[0.06] text-left transition-colors duration-150 cursor-pointer group"
                tabIndex={0}
              >
                <Settings className="w-4 h-4 text-brand-accent/80 group-hover:text-brand-accent shrink-0 transition-colors duration-150" />
                <span className="flex-1 font-medium">Settings</span>
              </button>

              {/* ── Theme ─────────────────────────────────────────────────────── */}
              <button
                id="admin-avatar-menu-theme"
                type="button"
                role="menuitem"
                onClick={() => setActiveMenu("theme")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-brand-secondary hover:text-brand-text hover:bg-brand-text/[0.06] text-left transition-colors duration-150 cursor-pointer group"
              >
                <Palette className="w-4 h-4 text-brand-accent/80 group-hover:text-brand-accent shrink-0 transition-colors duration-150" />
                <span className="flex-1 font-medium text-left">Theme</span>
                <ChevronRight className="w-4 h-4 text-brand-secondary" />
              </button>

              {/* Note: Sound item is removed per Jimmy's explicit instructions */}

              <div className="my-1.5 border-t border-brand-text/10" role="separator" />

              {/* ── Sign Out ──────────────────────────────────────────────────── */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 text-left transition-colors duration-150 cursor-pointer group font-medium"
                role="menuitem"
              >
                <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-400 transition-colors" />
                <span>Sign Out</span>
              </button>
            </>
          )}

          {activeMenu === "theme" && (
            <ThemeSubmenu
              onBack={() => setActiveMenu("main")}
              onSelect={() => {
                setActiveMenu("main");
                setIsOpen(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAvatarDropdown;
