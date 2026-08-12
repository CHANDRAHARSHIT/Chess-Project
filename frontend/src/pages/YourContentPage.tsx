/**
 * YourContentPage.tsx
 *
 * Full Showcase Page for /your-content route.
 * Features category filtering and non-clickable content cards with tooltips.
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { ContentFilterBar } from "@/components/creator/ContentFilterBar";
import { ContentGridCard } from "@/components/creator/ContentGridCard";
import { MASTERCLASSES } from "@/data/creatorMockData";
import { soundManager } from "@/utils/SoundManager";

export default function YourContentPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Interactive Lesson", "Opening Course", "PGN Study", "Endgame Strategy", "Drafts"];

  // Filtering logic by category
  const filteredItems = useMemo(() => {
    return MASTERCLASSES.filter((item) => {
      if (selectedCategory === "Drafts") {
        return item.status === "Draft";
      } else if (selectedCategory !== "All") {
        return item.category === selectedCategory;
      }
      return true;
    });
  }, [selectedCategory]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-brand-bg text-brand-text py-6 sm:py-8 md:py-10 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto space-y-6 sm:space-y-8 animate-fadeIn overflow-x-hidden">
      {/* Back Navigation */}
      <div>
        <button
          type="button"
          onClick={() => {
            soundManager.playButtonClick();
            navigate("/");
          }}
          className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-text transition-colors duration-200 font-sans text-sm font-semibold cursor-pointer group"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </button>
      </div>
      {/* Filter Toolbar */}
      <ContentFilterBar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        totalItemsCount={filteredItems.length}
      />

      {/* Content Library Grid */}
      {filteredItems.length === 0 ? (
        <div className="w-full rounded-3xl border border-brand-text/10 bg-obsidian-mid p-12 text-center space-y-3">
          <span className="text-3xl">♟️</span>
          <h3 className="text-lg font-display font-bold text-brand-text">No content matches your filter</h3>
          <p className="text-xs sm:text-sm font-sans text-brand-secondary">
            Select another category to view available content.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ContentGridCard
              key={item.id}
              item={item}
            />
          ))}
        </div>
      )}
    </div>
  );
}

