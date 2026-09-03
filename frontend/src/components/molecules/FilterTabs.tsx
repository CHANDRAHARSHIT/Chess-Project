import { soundManager } from "@/lib/SoundManager";

export interface FilterTabOption<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface FilterTabsProps<T extends string = string> {
  tabs: FilterTabOption<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
  size?: "sm" | "md";
}

export function FilterTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = "",
  size = "md",
}: FilterTabsProps<T>) {
  const sizeStyles = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-1.5 text-sm",
  }[size];

  return (
    <div
      className={`flex items-center gap-1.5 p-1 rounded border border-brand-border bg-brand-surface/60 overflow-x-auto no-scrollbar select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => {
              if (!tab.disabled && !isActive) {
                soundManager.playButtonClick();
                onChange(tab.id);
              }
            }}
            className={`inline-flex items-center gap-2 rounded font-medium transition-all duration-200 cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${sizeStyles} ${
              isActive
                ? "bg-brand-accent text-obsidian font-semibold shadow-sm"
                : "text-brand-secondary hover:text-brand-text hover:bg-brand-accent/5"
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-obsidian/20 text-obsidian"
                    : "bg-brand-surface text-brand-secondary"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default FilterTabs;
