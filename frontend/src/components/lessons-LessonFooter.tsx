import { useState, useEffect } from "react";
import { HardDrive, CloudUpload, Check, WifiOff, AlertCircle } from "lucide-react";
import type { SyncState } from "@/services/lessons-lessonSync.service";

export interface LessonFooterProps {
  currentSlideNumber: number;
  totalSlidesCount: number;
  activeSegmentTitle?: string;
  saveStatus: SyncState;
}

export function LessonFooter({
  currentSlideNumber,
  totalSlidesCount,
  activeSegmentTitle,
  saveStatus,
}: LessonFooterProps) {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Auto-hide "Saved" status after 3 seconds, keeping "Saving..." / "Offline" / "Error" visible while active
  useEffect(() => {
    if (saveStatus === "saving_local" || saveStatus === "syncing") {
      setIsVisible(true);
    } else if (saveStatus === "saved") {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else if (saveStatus === "offline" || saveStatus === "error") {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [saveStatus]);

  return (
    <footer className="h-8 border-t border-brand-border bg-brand-bg px-6 flex items-center justify-between text-xs text-brand-secondary shrink-0 select-none">
      <div className="flex items-center gap-4 font-sans">
        <span>
          Slide <strong className="text-brand-text">{currentSlideNumber}</strong> of{" "}
          <strong className="text-brand-text">{totalSlidesCount}</strong>
        </span>
        <span className="text-brand-border">•</span>
        <span className="text-brand-secondary/80">
          {activeSegmentTitle || "Segment"}
        </span>
      </div>

      <div className="flex items-center gap-3 font-mono text-[11px]">
        {/* Bottom-Right Temporary Save Status Indicator */}
        {isVisible && (
          <>
            <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
              {saveStatus === "saving_local" && (
                <span className="flex items-center gap-1.5 text-brand-accent font-semibold">
                  <HardDrive className="w-3.5 h-3.5 animate-pulse text-brand-accent" />
                  <span>Saving...</span>
                </span>
              )}
              {saveStatus === "syncing" && (
                <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                  <CloudUpload className="w-3.5 h-3.5 animate-bounce" />
                  <span>Syncing...</span>
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </span>
              )}
              {saveStatus === "offline" && (
                <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline (cached)</span>
                </span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Save failed</span>
                </span>
              )}
            </div>
            <span className="text-brand-border">•</span>
          </>
        )}

        <span>16:9 Canvas</span>
        <span className="text-brand-border">•</span>
        <span>1920 × 1080</span>
      </div>
    </footer>
  );
}
