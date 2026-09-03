import { Image, X, Info } from "lucide-react";

interface ThumbnailComingSoonModalProps {
  onClose: () => void;
}

export function ThumbnailComingSoonModal({ onClose }: ThumbnailComingSoonModalProps) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl shadow-2xl p-6 font-sans text-brand-text space-y-5 animate-in zoom-in-95 duration-150 relative"
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          title="Close"
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-brand-secondary hover:text-brand-text hover:bg-brand-text/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Image className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-brand-text">
              Thumbnail Upload Coming Soon
            </h3>
            <p className="text-xs text-amber-400/90 font-medium mt-0.5 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>Preview mode active (Frontend only)</span>
            </p>
          </div>
        </div>

        <p className="text-sm text-brand-secondary leading-relaxed bg-brand-bg/50 border border-brand-border/40 p-4 rounded-xl">
          You've successfully prepared your thumbnail, but permanent thumbnail storage isn't available yet. Your edited image is only being previewed locally.
        </p>

        <div className="flex items-center justify-end pt-2 border-t border-brand-border/40">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-brand-accent text-brand-bg hover:bg-brand-accent-hover text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
