import { useState, useMemo } from 'react';
import { Search, X, Dices } from 'lucide-react';
import { VariantCard } from '../components/play/VariantCard';

const VARIANTS_LIST = [
  {
    id: 'chess960',
    name: 'Chess 960',
    tagline:
      'Fischer Random chess with randomized piece back-ranks for fresh strategic battles.',
    href: '/play/chess960',
    keywords: ['chess960', 'chess 960', 'fischer', 'random'],
  },
];

export default function VariantsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVariants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return VARIANTS_LIST;
    return VARIANTS_LIST.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.tagline.toLowerCase().includes(q) ||
        v.keywords.some((k) => k.includes(q))
    );
  }, [searchQuery]);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header section */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent">
            <Dices className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-brand-text tracking-tight">
              Chess Variants
            </h1>
            <p className="text-sm text-brand-secondary">
              Chess reinvented, one rule at a time.
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-secondary pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search variants..."
          className="w-full pl-10 pr-10 py-2.5 text-sm font-sans rounded-xl outline-none transition-all duration-200 placeholder:text-brand-secondary/40 bg-brand-surface/60 border border-brand-border/60 text-brand-text focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/30"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-secondary hover:text-brand-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Variants List Grid */}
      <div className="space-y-4">
        {filteredVariants.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-brand-border/40 rounded-2xl bg-brand-surface/20 space-y-2">
            <p className="text-brand-text font-medium">No variants found</p>
            <p className="text-xs text-brand-secondary">
              Try adjusting your search query.
            </p>
          </div>
        ) : (
          filteredVariants.map((variant) => (
            <VariantCard
              key={variant.id}
              name={variant.name}
              tagline={variant.tagline}
              href={variant.href}
            />
          ))
        )}
      </div>
    </div>
  );
}
