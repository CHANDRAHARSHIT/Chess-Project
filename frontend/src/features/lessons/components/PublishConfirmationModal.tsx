import { Globe, Loader2, X } from "lucide-react";

export interface PublishModalProps {
  currentStatus: "DRAFT" | "PUBLISHED";
  isPublishing: boolean;
  isSavingDraft: boolean;
  onConfirmPublish: () => void;
  onSaveAsDraft: () => void;
  onClose: () => void;
}

export function PublishConfirmationModal({
  currentStatus,
  isPublishing,
  isSavingDraft,
  onConfirmPublish,
  onSaveAsDraft,
  onClose,
}: PublishModalProps) {
  const isRepublish = currentStatus === "PUBLISHED";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl shadow-2xl p-6 font-sans text-brand-text space-y-5 animate-in zoom-in-95 duration-150 relative"
      >
        {/* Subtle Top-Right X Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isPublishing || isSavingDraft}
          title="Close"
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-brand-secondary hover:text-brand-text hover:bg-brand-text/10 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center text-brand-accent shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-brand-text">
              {isRepublish ? "Republish Lesson?" : "Publish Lesson?"}
            </h3>
            <p className="text-xs text-brand-secondary mt-0.5">
              {isRepublish
                ? "Update published content for learners."
                : "Make your lesson available to students."}
            </p>
          </div>
        </div>

        <p className="text-sm text-brand-secondary leading-relaxed">
          {isRepublish
            ? "Are you sure you want to republish this lesson? All recent updates to slides, text, and positions will be saved to your published lesson."
            : "Are you sure you want to publish this lesson? It will be marked as published in your library."}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-brand-border/40">
          {/* Save as draft Button */}
          <button
            type="button"
            onClick={onSaveAsDraft}
            disabled={isPublishing || isSavingDraft}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-brand-border/60 hover:bg-brand-text/5 text-brand-secondary hover:text-brand-text text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSavingDraft ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving draft...</span>
              </>
            ) : (
              <span>Save as draft</span>
            )}
          </button>

          {/* Publish Lesson Button */}
          <button
            type="button"
            onClick={onConfirmPublish}
            disabled={isPublishing || isSavingDraft}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-accent text-brand-bg hover:bg-brand-accent-hover text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5" />
                <span>{isRepublish ? "Republish Lesson" : "Publish Lesson"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
