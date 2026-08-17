/**
 * LeaveGameConfirmModal.tsx
 *
 * Confirmation modal rendered by PlayHubPage when the user attempts to switch
 * away from the Online tab while a multiplayer session or matchmaking search
 * is active.
 *
 * Default action: "Stay in game" (primary, focused on open).
 * Destructive action: "Leave multiplayer session" (secondary).
 *
 * Matches the AuthModal pattern: createPortal, scroll lock, Escape key,
 * backdrop click to dismiss (treated as "Stay in game").
 */
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Swords, AlertTriangle } from "lucide-react";

interface LeaveGameConfirmModalProps {
  isOpen: boolean;
  /** Called when user chooses to stay (Escape, backdrop click, or primary button). */
  onStay: () => void;
  /** Called when user explicitly confirms they want to leave the session. */
  onLeave: () => void;
}

export function LeaveGameConfirmModal({ isOpen, onStay, onLeave }: LeaveGameConfirmModalProps) {
  const stayButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Focus primary action on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => stayButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Escape key → stay
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onStay(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [isOpen, onStay]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) onStay();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-bg/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-game-modal-title"
    >
      <div
        ref={modalRef}
        className="relative max-w-sm w-full bg-brand-surface/95 border border-brand-border rounded-xl p-8 shadow-2xl shadow-brand-bg/50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h2
            id="leave-game-modal-title"
            className="text-xl font-sans font-bold text-brand-text tracking-wide"
          >
            Leave multiplayer session?
          </h2>
          <p className="text-xs text-brand-secondary/80 mt-2 font-sans leading-relaxed">
            You have an active game or matchmaking search in progress.
            Leaving this view will disconnect you from the session and
            cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {/* Primary — stay (default focus) */}
          <button
            ref={stayButtonRef}
            onClick={onStay}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-accent text-black font-mono font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:brightness-110 active:scale-[0.98] cursor-pointer shadow-md shadow-brand-accent/20"
          >
            <Swords className="w-3.5 h-3.5" />
            Stay in game
          </button>

          {/* Secondary — leave (destructive) */}
          <button
            onClick={onLeave}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500/50 font-mono font-semibold text-xs uppercase tracking-widest transition-all duration-200 cursor-pointer"
          >
            Leave multiplayer session
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
