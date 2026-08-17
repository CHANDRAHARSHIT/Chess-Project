import { useState, useRef, useEffect } from "react";
import { Link as LinkIcon, X, Check } from "lucide-react";

export interface LinkPopoverProps {
  initialUrl?: string;
  onApply: (url: string) => void;
  onRemove?: () => void;
  onClose: () => void;
}

export function LinkPopover({ initialUrl = "https://", onApply, onRemove, onClose }: LinkPopoverProps) {
  const [url, setUrl] = useState<string>(initialUrl || "https://");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onApply(url.trim());
    }
  };

  return (
    <div
      ref={popoverRef}
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute left-0 top-full mt-2 w-80 p-3 rounded-xl bg-brand-surface border border-brand-border shadow-2xl z-50 font-sans text-xs flex flex-col gap-2.5 select-none"
    >
      <div className="flex items-center justify-between border-b border-brand-border/40 pb-1.5 text-brand-secondary font-medium">
        <div className="flex items-center gap-1.5 text-brand-accent font-semibold">
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Insert Hyperlink</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-brand-text/10 text-brand-secondary hover:text-brand-text cursor-pointer transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          autoFocus
          className="flex-1 px-2.5 py-1.5 rounded-md bg-brand-bg text-brand-text border border-brand-border/60 outline-none focus:border-brand-accent text-xs font-mono"
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-md bg-brand-accent text-brand-bg hover:bg-brand-accent-hover font-semibold cursor-pointer transition-colors flex items-center gap-1 shrink-0"
        >
          <Check className="w-3.5 h-3.5" />
          <span>OK</span>
        </button>
      </form>

      {onRemove && (
        <div className="flex justify-end pt-1 border-t border-brand-border/30">
          <button
            type="button"
            onClick={onRemove}
            className="text-[11px] text-red-400 hover:underline cursor-pointer font-medium"
          >
            Remove Link
          </button>
        </div>
      )}
    </div>
  );
}
