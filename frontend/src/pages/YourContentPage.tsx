/**
 * YourContentPage.tsx
 *
 * Full Showcase Page for /your-content route (Creator Command Center).
 * Features real-time search & category filtering, interactive content cards,
 * and hero preview modal triggers.
 */

import { useState, useMemo } from "react";
import { ContentFilterBar } from "../components/creator/ContentFilterBar";
import { ContentGridCard } from "../components/creator/ContentGridCard";
import { SynchronizedStudyModal } from "../components/creator/SynchronizedStudyModal";
import { MASTERCLASSES, type MasterclassItem } from "../data/creatorMockData";
import { soundManager } from "../utils/SoundManager";
import { Sparkles } from "lucide-react";

export default function YourContentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<MasterclassItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categories = ["All", "Interactive Lesson", "Opening Course", "PGN Study", "Endgame Strategy", "Drafts"];

  // Real-time Filtering logic
  const filteredItems = useMemo(() => {
    return MASTERCLASSES.filter((item) => {
      // Category match
      if (selectedCategory === "Drafts") {
        if (item.status !== "Draft") return false;
      } else if (selectedCategory !== "All" && item.category !== selectedCategory) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesCategory;
      }

      return true;
    });
  }, [searchQuery, selectedCategory]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateNew = () => {
    soundManager.playButtonClick();
    showToast("Interactive Lesson Builder initialized for Alex Vance!");
    if (MASTERCLASSES.length > 0) {
      setSelectedPreviewItem(MASTERCLASSES[0]);
    }
  };

  const handlePinContent = (item: MasterclassItem) => {
    soundManager.playButtonClick();
    showToast(`"${item.title}" pinned to Channel Featured!`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-brand-bg text-brand-text py-6 sm:py-8 md:py-10 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto space-y-8 sm:space-y-10 animate-fadeIn overflow-x-hidden">
      {/* Toast Notification Floating Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-brand-accent text-obsidian font-sans text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-obsidian" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter & Command Bar */}
      <ContentFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        totalItemsCount={filteredItems.length}
        onCreateNewClick={handleCreateNew}
      />

      {/* Content Library Grid */}
      {filteredItems.length === 0 ? (
        <div className="w-full rounded-3xl border border-brand-text/10 bg-obsidian-mid p-12 text-center space-y-3 shadow-xl">
          <span className="text-3xl">♟️</span>
          <h3 className="text-lg font-display font-bold text-brand-text">No content matches your filter</h3>
          <p className="text-xs sm:text-sm font-sans text-brand-secondary">
            Try searching for "Catalan" or "Najdorf" to discover Alex Vance's masterclasses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ContentGridCard
              key={item.id}
              item={item}
              onPreviewClick={(selected) => setSelectedPreviewItem(selected)}
              onPinClick={handlePinContent}
            />
          ))}
        </div>
      )}

      {/* Synchronized Lesson Hero Modal */}
      <SynchronizedStudyModal
        item={selectedPreviewItem}
        onClose={() => setSelectedPreviewItem(null)}
      />
    </div>
  );
}
