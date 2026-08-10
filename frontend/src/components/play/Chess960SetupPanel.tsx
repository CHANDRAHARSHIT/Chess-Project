import { useState, useEffect } from 'react';
import { X, Shuffle, Play, Bot, Check } from 'lucide-react';
import { DIFFICULTY_CONFIGS, type DifficultyLevel } from '../../types/chess';
import { type Chess960GameOptions } from '../../hooks/useChess960Game';
import { soundManager } from '../../utils/SoundManager';
import { useButtonGlow } from '../../hooks/useButtonGlow';

interface Chess960SetupPanelProps {
  isOpen: boolean;
  onStart: (options: Chess960GameOptions) => void;
  onClose: () => void;
}

const ELO_TIER_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-emerald-500', text: 'text-emerald-950 font-black', border: 'border-emerald-400' },
  2: { bg: 'bg-sky-500', text: 'text-sky-950 font-black', border: 'border-sky-400' },
  3: { bg: 'bg-amber-400', text: 'text-amber-950 font-black', border: 'border-amber-300' },
  4: { bg: 'bg-rose-500', text: 'text-rose-950 font-black', border: 'border-rose-400' },
  5: { bg: 'bg-purple-500', text: 'text-purple-950 font-black', border: 'border-purple-400' },
};

export function Chess960SetupPanel({
  isOpen,
  onStart,
  onClose,
}: Chess960SetupPanelProps) {
  const [selectedColor, setSelectedColor] = useState<'w' | 'b' | 'random'>('random');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(3);
  const startBtnRef = useButtonGlow<HTMLButtonElement>();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playButtonClick();
    onStart({
      playerColor: selectedColor,
      difficulty: selectedDifficulty,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-title"
    >
      <div
        className="relative bg-brand-surface/90 border border-white/10 shadow-2xl rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 text-brand-text backdrop-blur-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Ambient Glow Ring */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Header */}
        <div className="relative border-b border-white/10 pb-4 sm:pb-5 space-y-3">
          {/* Top Bar: Variant Icon + Badge (Left) and Close Cross (Right) */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-brand-accent/15 text-brand-accent shadow-md shrink-0">
                <Shuffle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-brand-accent/15 text-brand-accent border border-brand-accent/20 truncate">
                Fischer Random
              </span>
            </div>

            <button
              onClick={() => {
                soundManager.playButtonClick();
                onClose();
              }}
              className="p-2 rounded-xl text-brand-secondary hover:text-brand-text hover:bg-brand-surface/80 border border-transparent transition-all cursor-pointer shrink-0"
              title="Close setup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title & Subtitle */}
          <div>
            <h2 id="setup-title" className="font-display font-bold text-xl sm:text-2xl text-brand-text tracking-tight">
              Chess 960 Setup
            </h2>
            <p className="text-xs text-brand-secondary/90 mt-1 leading-relaxed">
              Randomized piece back-ranks • 960 symmetrical starting positions
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Color Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono uppercase tracking-widest text-brand-secondary font-bold">
                Choose Side
              </label>
              <span className="text-[11px] font-mono text-brand-accent font-medium">
                {selectedColor === 'w' ? 'Play White (First Move)' : selectedColor === 'b' ? 'Play Black' : 'Random Allocation'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'w', label: 'White', icon: '♔', subtitle: 'Moves First' },
                { id: 'random', label: 'Random', icon: '☯', subtitle: 'Auto-Assign' },
                { id: 'b', label: 'Black', icon: '♚', subtitle: 'Counter-Attack' },
              ].map((opt) => {
                const isActive = selectedColor === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      soundManager.playButtonClick();
                      setSelectedColor(opt.id as 'w' | 'b' | 'random');
                    }}
                    className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-brand-accent/15 border-brand-accent text-brand-text shadow-[0_0_20px_rgba(212,175,110,0.15)] scale-[1.02]'
                        : 'bg-brand-surface/50 border-white/5 text-brand-secondary hover:border-white/10 hover:text-brand-text hover:bg-brand-surface/80'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-accent" />
                      </div>
                    )}
                    <span className="text-3xl mb-1 drop-shadow-md">{opt.icon}</span>
                    <span className="text-xs font-bold font-sans text-brand-text">{opt.label}</span>
                    <span className="text-[10px] font-mono text-brand-secondary/80 mt-0.5">{opt.subtitle}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono uppercase tracking-widest text-brand-secondary font-bold">
                Engine Difficulty
              </label>
              <div className="flex items-center gap-1.5 text-xs font-mono text-brand-secondary">
                <Bot className="w-3.5 h-3.5 text-brand-accent" />
                <span>Stockfish v16</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 max-h-[230px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-brand-accent/20">
              {Object.values(DIFFICULTY_CONFIGS).map((config) => {
                const isActive = selectedDifficulty === config.level;
                const tierStyle = ELO_TIER_COLORS[config.level] || ELO_TIER_COLORS[3];

                return (
                  <button
                    key={config.level}
                    type="button"
                    onClick={() => {
                      soundManager.playButtonClick();
                      setSelectedDifficulty(config.level);
                    }}
                    className={`group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-brand-accent/15 border-brand-accent text-brand-text shadow-[0_0_20px_rgba(212,175,110,0.15)]'
                        : 'bg-brand-surface/40 border-white/5 text-brand-secondary hover:border-white/10 hover:text-brand-text hover:bg-brand-surface/80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm text-brand-text group-hover:text-brand-accent transition-colors">
                          {config.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
                        >
                          {config.rating} ELO
                        </span>
                      </div>
                      <p className="text-xs text-brand-secondary/90">
                        {config.description}
                      </p>
                    </div>

                    {/* Checkmark or Selection Dot */}
                    <div className="shrink-0 pl-3">
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-brand-accent border-brand-accent text-black shadow-md'
                            : 'border-white/10 text-transparent group-hover:border-white/20'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start CTA */}
          <div className="pt-2">
            <button
              ref={startBtnRef}
              type="submit"
              className="w-full py-4 px-6 rounded-2xl font-mono text-xs uppercase tracking-widest font-bold btn-premium-cta btn-glow-container btn-glow-accent cta-shine cursor-pointer shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 group"
            >
              <Play className="w-4 h-4 text-brand-accent fill-brand-accent/30 group-hover:scale-110 transition-transform" />
              <span>Start Fischer Random Game</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

