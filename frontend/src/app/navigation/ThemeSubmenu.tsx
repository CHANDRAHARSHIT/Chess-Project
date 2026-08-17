import React from "react";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "@/shared/appearance/useTheme";

interface ThemeSubmenuProps {
  onBack: () => void;
  onSelect: () => void;
}

export const ThemeSubmenu: React.FC<ThemeSubmenuProps> = ({ onBack, onSelect }) => {
  const { themeMode, setThemeModeId } = useTheme();

  const handleSelect = (modeId: string) => {
    setThemeModeId(modeId);
    onSelect();
  };

  return (
    <>
      {/* Theme header */}
      <button
        type="button"
        onClick={onBack}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-brand-secondary hover:text-brand-text hover:bg-brand-text/[0.06] text-left transition-colors duration-150 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="font-medium text-brand-text">Theme</span>
      </button>

      <div className="px-4 pt-2 pb-3">
        <p className="text-xs text-brand-secondary">
          Choose your appearance
        </p>
      </div>

      <div className="border-t border-[rgba(212,175,110,0.40)]" />

      <button
        type="button"
        onClick={() => handleSelect("system")}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-sans text-brand-secondary hover:text-brand-text hover:bg-brand-text/[0.06] transition-colors duration-150 cursor-pointer"
      >
        <div className="w-6 flex justify-center items-center">
          {themeMode.id === "system" && (
            <span className="text-brand-text text-base">✓</span>
          )}
        </div>

        <span className="flex-1 text-left">
          Use device theme
        </span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect("dark")}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-sans text-brand-secondary hover:text-brand-text hover:bg-brand-text/[0.06] transition-colors duration-150 cursor-pointer"
      >
        <div className="w-6 flex justify-center items-center">
          {themeMode.id === "dark" && (
            <span className="text-brand-text text-base">✓</span>
          )}
        </div>

        <span className="flex-1 text-left">
          Dark theme
        </span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect("light")}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-sans text-brand-secondary hover:text-brand-text hover:bg-brand-text/[0.06] transition-colors duration-150 cursor-pointer"
      >
        <div className="w-6 flex justify-center items-center">
          {themeMode.id === "light" && (
            <span className="text-brand-text text-base">✓</span>
          )}
        </div>

        <span className="flex-1 text-left">
          Light theme
        </span>
      </button>
    </>
  );
};
