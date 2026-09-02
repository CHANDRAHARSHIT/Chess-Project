/**
 * PlayTabBar.tsx
 *
 * Purely presentational tab navigation bar for the Play Hub.
 * Renders four tabs: Quick Game, Play Online, Variants, Maia.
 * All state and event handling lives in the parent (PlayHubPage).
 */
import { Zap, Swords, Shuffle, Brain } from "lucide-react";
import { soundManager } from "@/shared/lib/SoundManager";
import { featureFlags } from "@/shared/lib/featureFlags";

export type PlayTab = "quick" | "online" | "variants" | "maia";

interface PlayTabBarProps {
  activeTab: PlayTab;
  onTabChange: (tab: PlayTab) => void;
  /** When true, the Online tab renders a subtle warning indicator to signal
   *  that an active multiplayer session is in progress. */
  isOnlineActive?: boolean;
}

const TABS: {
  id: PlayTab;
  label: string;
  Icon: React.ElementType;
  disabled?: boolean;
}[] = [
  { id: "quick", label: "Quick Game", Icon: Zap },
  {
    id: "online",
    label: "Play Online",
    Icon: Swords,
    disabled: !featureFlags.enablePlayOnline,
  },
  { id: "variants", label: "Variants", Icon: Shuffle },
  ...(featureFlags.showMaia
    ? [{ id: "maia" as const, label: "Maia", Icon: Brain }]
    : []),
];

export function PlayTabBar({
  activeTab,
  onTabChange,
  isOnlineActive = false,
}: PlayTabBarProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-brand-surface/60 border border-white/5 backdrop-blur-md w-full sm:w-auto">
      {TABS.map(({ id, label, Icon, disabled }) => {
        const isActive = activeTab === id;
        const showPing = id === "online" && isOnlineActive && !isActive;

        return (
          <button
            key={id}
            onClick={() => {
              if (disabled) return;
              soundManager.playButtonClick();
              onTabChange(id);
            }}
            disabled={disabled}
            title={disabled ? "Coming soon" : undefined}
            className={`relative flex items-center justify-center gap-2 flex-1 sm:flex-none sm:px-5 px-3 py-2.5 rounded-xl text-xs font-mono font-bold transition-all duration-200 ${
              disabled
                ? "opacity-40 cursor-not-allowed text-brand-secondary"
                : isActive
                  ? "bg-brand-accent text-black cursor-pointer"
                  : "text-brand-secondary hover:text-brand-text hover:bg-brand-text/5 cursor-pointer"
            }`}
            aria-selected={isActive}
            role="tab"
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(" ")[0]}</span>

            {/* Live session indicator dot on the Online tab when a game is active */}
            {showPing && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
