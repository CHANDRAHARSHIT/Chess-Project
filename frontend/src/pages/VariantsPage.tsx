import { useState, useMemo } from 'react';
import { Search, X, Dices, Sparkles, Flame, ShieldAlert, Cpu, Trophy, Zap } from 'lucide-react';
import { VariantCard, type VariantCardProps } from '../components/play/VariantCard';

const VARIANTS_LIST: VariantCardProps[] = [
  {
    id: 'chess960',
    name: 'Chess 960',
    tagline:
      'Fischer Random chess with randomized piece back-ranks for fresh strategic battles without memorized opening lines.',
    href: '/play/chess960',
    categoryTag: 'Fischer Random',
    tags: ['960 Starting Positions', 'Stockfish v16 Bot', 'Pure Strategic Battle'],
    isPlayable: true,
    badge: 'PLAYABLE NOW',
  },
  {
    id: 'atomic',
    name: 'Atomic Chess',
    tagline:
      'Explosive capture chain-reactions where capturing a piece destroys adjacent squares, pawns, and nearby units.',
    href: '#',
    categoryTag: 'Explosive Tactics',
    tags: ['Chain Reaction', 'Volatile Kings', 'Coming Soon'],
    isPlayable: false,
    badge: 'IN LAB',
  },
  {
    id: 'kingofthehill',
    name: 'King of the Hill',
    tagline:
      'Race your King to the central four squares (d4, d5, e4, e5) for an instant strategic conquest victory.',
    href: '#',
    categoryTag: 'Center Control',
    tags: ['Center Rush', 'Aggressive Kings', 'Coming Soon'],
    isPlayable: false,
    badge: 'IN LAB',
  },
  {
    id: 'threecheck',
    name: 'Three-Check',
    tagline:
      'Deliver 3 checks to the enemy King before they checkmate or check you to claim instant check victory.',
    href: '#',
    categoryTag: 'King Hunt',
    tags: ['3 Check Wins', 'High Velocity', 'Coming Soon'],
    isPlayable: false,
    badge: 'IN LAB',
  },
];

export default function VariantsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'playable' | 'lab'>('all');

  const filteredVariants = useMemo(() => {
    return VARIANTS_LIST.filter((v) => {
      // Tab filter
      if (activeTab === 'playable' && !v.isPlayable) return false;
      if (activeTab === 'lab' && v.isPlayable) return false;

      // Text query search
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      return (
        v.name.toLowerCase().includes(q) ||
        v.tagline.toLowerCase().includes(q) ||
        v.categoryTag?.toLowerCase().includes(q) ||
        v.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, activeTab]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 select-none">
      {/* Top Ambient Lighting Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-radial from-brand-accent/15 via-brand-accent/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Header Section */}
      <div className="relative rounded-3xl bg-brand-surface/60 border border-white/10 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl space-y-6 overflow-hidden">
        {/* Subtle Decorative Pattern */}
        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-brand-accent">
          <Dices className="w-80 h-80 stroke-[1]" />
        </div>

        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/15 text-brand-accent font-mono text-[11px] uppercase tracking-widest font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Chess Reinvented • Infinite Strategy</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-brand-text tracking-tight leading-[1.1]">
            Explore <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">Chess Variants</span>
          </h1>

          <p className="text-sm sm:text-base text-brand-secondary/90 leading-relaxed font-sans max-w-2xl">
            Escape memorized opening theory. Play Fischer Random (Chess 960) with randomized back-ranks, stockfish engine bots, and upcoming tactical modes built for pure skill.
          </p>
        </div>

        {/* Feature Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 font-mono text-xs">
          <div className="p-3 rounded-2xl bg-brand-bg/60 border border-white/5 flex items-center gap-3">
            <Zap className="w-4 h-4 text-brand-accent shrink-0" />
            <div>
              <p className="text-brand-text font-bold">960 Setups</p>
              <p className="text-[10px] text-brand-secondary">Fischer Random</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-brand-bg/60 border border-white/5 flex items-center gap-3">
            <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-brand-text font-bold">Stockfish Bot</p>
              <p className="text-[10px] text-brand-secondary">800 - 2400 Elo</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-brand-bg/60 border border-white/5 flex items-center gap-3">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-brand-text font-bold">No Book Theory</p>
              <p className="text-[10px] text-brand-secondary">Pure Calculation</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-brand-bg/60 border border-white/5 flex items-center gap-3">
            <Flame className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <p className="text-brand-text font-bold">More Coming</p>
              <p className="text-[10px] text-brand-secondary">In Lab Testing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-brand-surface/60 border border-white/5 backdrop-blur-md">
          {(
            [
              { id: 'all', label: 'All Variants' },
              { id: 'playable', label: 'Playable Now' },
              { id: 'lab', label: 'In Lab' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-brand-accent text-black shadow-md shadow-brand-accent/20'
                  : 'text-brand-secondary hover:text-brand-text hover:bg-brand-surface/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative max-w-md w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-secondary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search variants..."
            className="w-full pl-10 pr-10 py-2.5 text-xs font-mono rounded-2xl outline-none transition-all duration-200 placeholder:text-brand-secondary/50 bg-brand-surface/60 border border-white/5 text-brand-text focus:border-brand-accent/40 backdrop-blur-md shadow-sm"
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
      </div>

      {/* Variants List Grid */}
      <div className="space-y-4">
        {filteredVariants.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-brand-border/50 rounded-3xl bg-brand-surface/30 backdrop-blur-md space-y-3">
            <ShieldAlert className="w-8 h-8 text-brand-secondary mx-auto" />
            <p className="text-brand-text font-semibold">No matching variants found</p>
            <p className="text-xs text-brand-secondary font-mono">
              Try resetting your search query or tab selection.
            </p>
          </div>
        ) : (
          filteredVariants.map((variant) => (
            <VariantCard key={variant.id} {...variant} />
          ))
        )}
      </div>
    </div>
  );
}

