import { useRef, useEffect } from "react";
import { Scissors, Copy, Clipboard, Link as LinkIcon, CheckSquare } from "lucide-react";

export interface ContextMenuProps {
  x: number;
  y: number;
  hasSelection: boolean;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onLink: () => void;
  onSelectAll: () => void;
  onClose: () => void;
}

export function ContextMenu({
  x,
  y,
  hasSelection,
  onCut,
  onCopy,
  onPaste,
  onLink,
  onSelectAll,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const MENU_WIDTH = 160;
  const MENU_HEIGHT = 190;
  const adjustedX = Math.min(x, window.innerWidth - MENU_WIDTH - 8);
  const adjustedY = Math.min(y, window.innerHeight - MENU_HEIGHT - 8);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed z-[100] w-40 py-1.5 px-1 rounded-xl bg-brand-surface border border-brand-border shadow-2xl font-sans text-xs text-brand-text select-none flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Cut */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={hasSelection ? onCut : undefined}
        disabled={!hasSelection}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
          hasSelection
            ? "text-brand-text hover:bg-brand-accent/15 hover:text-brand-accent cursor-pointer font-medium"
            : "text-brand-secondary/40 cursor-not-allowed"
        }`}
      >
        <div className="flex items-center gap-2">
          <Scissors className="w-3.5 h-3.5" />
          <span>Cut</span>
        </div>
        <span className="text-[10px] font-mono opacity-50">Ctrl+X</span>
      </button>

      {/* Copy */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={hasSelection ? onCopy : undefined}
        disabled={!hasSelection}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
          hasSelection
            ? "text-brand-text hover:bg-brand-accent/15 hover:text-brand-accent cursor-pointer font-medium"
            : "text-brand-secondary/40 cursor-not-allowed"
        }`}
      >
        <div className="flex items-center gap-2">
          <Copy className="w-3.5 h-3.5" />
          <span>Copy</span>
        </div>
        <span className="text-[10px] font-mono opacity-50">Ctrl+C</span>
      </button>

      {/* Paste */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onPaste}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-brand-text hover:bg-brand-accent/15 hover:text-brand-accent transition-colors cursor-pointer font-medium"
      >
        <div className="flex items-center gap-2">
          <Clipboard className="w-3.5 h-3.5" />
          <span>Paste</span>
        </div>
        <span className="text-[10px] font-mono opacity-50">Ctrl+V</span>
      </button>

      <div className="my-1 border-t border-brand-border/40" />

      {/* Link */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={hasSelection ? onLink : undefined}
        disabled={!hasSelection}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
          hasSelection
            ? "text-brand-text hover:bg-brand-accent/15 hover:text-brand-accent cursor-pointer font-medium"
            : "text-brand-secondary/40 cursor-not-allowed"
        }`}
      >
        <div className="flex items-center gap-2">
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Link</span>
        </div>
        <span className="text-[10px] font-mono opacity-50">Ctrl+K</span>
      </button>

      <div className="my-1 border-t border-brand-border/40" />

      {/* Select All */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSelectAll}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-brand-text hover:bg-brand-accent/15 hover:text-brand-accent transition-colors cursor-pointer font-medium"
      >
        <div className="flex items-center gap-2">
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Select All</span>
        </div>
        <span className="text-[10px] font-mono opacity-50">Ctrl+A</span>
      </button>
    </div>
  );
}
