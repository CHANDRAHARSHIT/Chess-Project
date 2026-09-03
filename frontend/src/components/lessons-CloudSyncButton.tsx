import { useState } from "react";
import { Cloud, CloudUpload, WifiOff, AlertCircle } from "lucide-react";
import type { SyncState } from "@/services/lessons-lessonSync.service";

export interface CloudSyncButtonProps {
  hasUnsyncedChanges: boolean;
  saveStatus: SyncState;
  onForceCloudSync: () => void;
}

export function CloudSyncButton({
  hasUnsyncedChanges,
  saveStatus,
  onForceCloudSync,
}: CloudSyncButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const isSyncing = saveStatus === "syncing";
  const isOffline = saveStatus === "offline";
  const isError = saveStatus === "error";

  // Determine icon & color based on storage state:
  // STATE A (LOCAL ONLY): Yellow / Gold accent icon
  // STATE B (LOCAL + CLOUD): Green theme icon
  let IconComponent = Cloud;
  let iconColorClass = "text-emerald-400";
  let titleText = "Saved to local storage";
  let subtitleText = "Saved to cloud storage";

  if (isSyncing) {
    IconComponent = CloudUpload;
    iconColorClass = "text-blue-400 animate-bounce";
    titleText = "Syncing changes to cloud...";
    subtitleText = "Please wait";
  } else if (isOffline) {
    IconComponent = WifiOff;
    iconColorClass = "text-amber-400";
    titleText = "Offline mode active";
    subtitleText = "Saved locally • Will sync when online";
  } else if (isError) {
    IconComponent = AlertCircle;
    iconColorClass = "text-red-400";
    titleText = "Cloud sync failed";
    subtitleText = "Click to retry syncing to cloud";
  } else if (hasUnsyncedChanges) {
    IconComponent = Cloud;
    iconColorClass = "text-brand-accent"; // Yellow / gold theme accent
    titleText = "Saved to local storage";
    subtitleText = "Not yet synced to cloud";
  } else {
    IconComponent = Cloud;
    iconColorClass = "text-emerald-400";
    titleText = "Saved to local storage";
    subtitleText = "Saved to cloud storage";
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={onForceCloudSync}
        disabled={isSyncing}
        title="Cloud Storage Status (Click to force cloud sync)"
        aria-label="Cloud Storage Status"
        className="p-[7px] rounded-lg bg-brand-surface border border-brand-border hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center"
      >
        <IconComponent className={`w-4 h-4 ${iconColorClass}`} />
      </button>

      {/* Styled Floating Tooltip Popover */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-56 p-3 rounded-xl bg-brand-surface border border-brand-border shadow-2xl z-50 font-sans text-xs text-brand-text select-none animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
          <div className="flex items-center gap-2 font-semibold">
            <div
              className={`w-2 h-2 rounded-full ${
                isSyncing
                  ? "bg-blue-400 animate-ping"
                  : isError
                  ? "bg-red-400"
                  : hasUnsyncedChanges
                  ? "bg-brand-accent"
                  : "bg-emerald-400"
              }`}
            />
            <span>{titleText}</span>
          </div>
          <p className="text-[11px] text-brand-secondary mt-1 font-mono leading-relaxed">
            {subtitleText}
          </p>
        </div>
      )}
    </div>
  );
}
