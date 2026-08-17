import { useEffect, useRef, useState } from "react";
import { Flag, Handshake } from "lucide-react";
import { soundManager } from "@/shared/lib/SoundManager";

interface GameActionBarProps {
  canAct: boolean;
  onResign: () => void;
}

const CONFIRM_TIMEOUT_MS = 4000;

export function GameActionBar({ canAct, onResign }: GameActionBarProps) {
  const [confirming, setConfirming] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleResignClick = () => {
    soundManager.playButtonClick();
    if (!confirming) {
      setConfirming(true);
      timeoutRef.current = window.setTimeout(() => setConfirming(false), CONFIRM_TIMEOUT_MS);
      return;
    }
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    setConfirming(false);
    onResign();
  };

  return (
    <div className="grid grid-cols-2 gap-2.5 p-2 h-[64px] items-center bg-brand-surface/60 border border-white/10 rounded-2xl backdrop-blur-xl">
      <button
        onClick={handleResignClick}
        onBlur={() => setConfirming(false)}
        disabled={!canAct}
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-mono text-[11px] uppercase tracking-wider font-bold transition-all duration-[var(--dur-quick)] disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] cursor-pointer ${
          confirming
            ? "bg-rose-500/20 border border-rose-500/60 text-rose-300"
            : "border border-white/10 bg-brand-bg/40 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 hover:bg-brand-surface/50"
        }`}
        title={confirming ? "Click again to confirm resignation" : "Resign this game"}
      >
        <Flag className="w-4 h-4 text-rose-400" />
        <span>{confirming ? "Confirm Resign?" : "Resign"}</span>
      </button>

      <button
        disabled
        aria-disabled="true"
        aria-describedby="draw-offer-reason"
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-mono text-[11px] uppercase tracking-wider font-semibold border border-white/5 bg-brand-bg/20 text-brand-secondary/40 opacity-40 cursor-not-allowed min-h-[44px]"
        title="Draw offers aren't available yet"
      >
        <Handshake className="w-4 h-4" />
        <span>Offer Draw</span>
      </button>
      <span id="draw-offer-reason" className="sr-only">
        Draw offers aren't available yet.
      </span>
    </div>
  );
}
