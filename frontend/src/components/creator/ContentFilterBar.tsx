/**
 * ContentFilterBar.tsx
 *
 * Real-Time Search & Category Filter Toolbar for /your-content.
 */

import { Search, Plus } from "lucide-react";
import { soundManager } from "../../utils/SoundManager";

interface ContentFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  totalItemsCount: number;
  onCreateNewClick: () => void;
}

export function ContentFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  totalItemsCount,
  onCreateNewClick,
}: ContentFilterBarProps) {
  const handleCategorySelect = (cat: string) => {
    soundManager.playButtonClick();
    onCategoryChange(cat);
  };

  return (
    <div className="w-full rounded-3xl border border-brand-text/15 bg-obsidian-mid p-4 sm:p-6 shadow-xl space-y-4">
      {/* Top Action Launcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-text">
            Creator Studio
          </h2>
          <p className="text-xs sm:text-sm font-sans text-stone-400 mt-0.5">
            Manage your interactive lessons, video masterclasses, and PGN studies
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onCreateNewClick();
            }}
            className="flex-1 sm:flex-initial btn-gold flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold shadow-lg hover:shadow-brand-accent/20 transition-all duration-200 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Interactive Lesson</span>
          </button>
        </div>
      </div>

      {/* Filter Row: Search & Category Chips */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2 border-t border-brand-text/10">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search lessons, openings, or PGN studies…"
            className="w-full pl-9 pr-4 py-2 text-xs font-sans rounded-xl outline-none bg-obsidian-glass border border-brand-text/20 text-brand-text placeholder:text-stone-500 focus:border-brand-accent/60 transition-colors"
          />
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-brand-accent text-obsidian font-bold shadow-md"
                    : "bg-brand-text/5 text-stone-300 hover:text-brand-text hover:bg-brand-text/10"
                }`}
              >
                {cat}
              </button>
            );
          })}

          <span className="ml-2 font-mono text-xs px-2.5 py-0.5 rounded bg-brand-text/5 text-brand-accent border border-brand-accent/30 font-semibold">
            {totalItemsCount} Total
          </span>
        </div>
      </div>
    </div>
  );
}
