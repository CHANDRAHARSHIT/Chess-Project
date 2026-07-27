import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { DIFFICULTY_CONFIGS, type DifficultyLevel } from '../../types/chess';
import { type Chess960GameOptions } from '../../hooks/useChess960Game';
import { soundManager } from '../../utils/SoundManager';

interface Chess960SetupPanelProps {
  isOpen: boolean;
  onStart: (options: Chess960GameOptions) => void;
  onClose: () => void;
}

export function Chess960SetupPanel({
  isOpen,
  onStart,
  onClose,
}: Chess960SetupPanelProps) {
  const [selectedColor, setSelectedColor] = useState<'w' | 'b' | 'random'>('random');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(3);

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
      className="fixed inset-0 z-50 bg-[#080B14]/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-title"
    >
      <div
        className="relative bg-brand-surface/90 border border-brand-accent/20 shadow-[0_0_50px_rgba(212,175,110,0.08)] rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 text-brand-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="setup-title" className="font-display font-bold text-xl text-white">
                Chess 960 Setup
              </h2>
              <p className="text-xs text-brand-secondary">
                Fischer Random rules applied • 960 starting positions
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-lg text-brand-secondary hover:text-white hover:bg-white/5 transition-colors"
            title="Close setup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Color Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-brand-secondary font-semibold">
              Choose Side
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'w', label: 'White', icon: '♔' },
                { id: 'random', label: 'Random', icon: '☯' },
                { id: 'b', label: 'Black', icon: '♚' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    soundManager.playButtonClick();
                    setSelectedColor(opt.id as 'w' | 'b' | 'random');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    selectedColor === opt.id
                      ? 'bg-brand-accent/15 border-brand-accent text-white shadow-[0_0_15px_rgba(212,175,110,0.15)]'
                      : 'bg-white/5 border-white/10 text-brand-secondary hover:border-brand-border hover:text-white'
                  }`}
                >
                  <span className="text-2xl mb-1">{opt.icon}</span>
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-brand-secondary font-semibold">
              Engine Difficulty
            </label>
            <div className="grid grid-cols-1 gap-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-brand-border/40">
              {Object.values(DIFFICULTY_CONFIGS).map((config) => (
                <button
                  key={config.level}
                  type="button"
                  onClick={() => {
                    soundManager.playButtonClick();
                    setSelectedDifficulty(config.level);
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    selectedDifficulty === config.level
                      ? 'bg-brand-accent/15 border-brand-accent text-white shadow-[0_0_15px_rgba(212,175,110,0.15)]'
                      : 'bg-white/5 border-white/10 text-brand-secondary hover:border-brand-border hover:text-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">
                        {config.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-brand-accent">
                        {config.rating} Elo
                      </span>
                    </div>
                    <p className="text-xs text-brand-secondary/80 mt-0.5">
                      {config.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Start CTA */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl font-display font-bold text-base text-black bg-gradient-to-r from-[#D4AF6E] via-[#F3E5AB] to-[#D4AF6E] hover:brightness-110 shadow-[0_0_25px_rgba(212,175,110,0.3)] transition-all duration-300 transform active:scale-[0.99]"
            >
              Start Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
