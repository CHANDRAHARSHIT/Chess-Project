/**
 * ContentFilterBar.tsx
 *
 * Toolbar for /your-content with category filtering.
 */

import { Plus } from "lucide-react";
import { soundManager } from "@/lib/SoundManager";

interface ContentFilterBarProps {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  totalItemsCount: number;
}

export function ContentFilterBar({
  selectedCategory,
  onCategoryChange,
  categories,
  totalItemsCount,
}: ContentFilterBarProps) {
  const handleCategorySelect = (cat: string) => {
    soundManager.playButtonClick();
    onCategoryChange(cat);
  };

  return (
    <div className="w-full rounded-3xl border border-brand-text/15 bg-obsidian-mid p-4 sm:p-6 space-y-4">
      {/* Top Action Launcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-text">
            Your Content
          </h2>
          <p className="text-xs sm:text-sm font-sans text-brand-secondary mt-0.5">
            Manage your interactive lessons, video masterclasses, and PGN studies
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            disabled
            title="Coming Soon"
            className="flex-1 sm:flex-initial btn-gold flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold opacity-50 cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>New Interactive Lesson</span>
          </button>
        </div>
      </div>

      {/* Filter Row: Category Chips */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-brand-text/10">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-brand-accent text-obsidian font-bold"
                    : "bg-brand-text/5 text-brand-text/60 hover:text-brand-text hover:bg-brand-text/10"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-brand-text/5 text-brand-accent border border-brand-accent/30 font-semibold">
          {totalItemsCount} Total
        </span>
      </div>
    </div>
  );
}

