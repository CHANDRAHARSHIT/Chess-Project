import { useState, useEffect } from 'react';
import { X, Shuffle, Play } from 'lucide-react';
import { DIFFICULTY_CONFIGS, type DifficultyLevel } from '../../types/chess';
import { type Chess960GameOptions } from '../../hooks/useChess960Game';
import { soundManager } from '../../utils/SoundManager';
import { useButtonGlow } from '../../hooks/useButtonGlow';

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
      className="fixed inset-0 z-50 bg-brand-bg/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-title"
    >
      <div
        className="relative bg-brand-surface border border-brand-accent/20 rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 text-brand-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="setup-title" className="font-display font-bold text-xl text-brand-text">
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
            className="p-2 rounded-lg text-brand-secondary hover:text-brand-text hover:bg-brand-surface/50 transition-colors"
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
                      ? 'bg-brand-accent/15 border-brand-accent text-brand-text'
                      : 'bg-brand-surface/40 border-brand-border/60 text-brand-secondary hover:border-brand-border hover:text-brand-text'
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
                      ? 'bg-brand-accent/15 border-brand-accent text-brand-text'
                      : 'bg-brand-surface/40 border-brand-border/60 text-brand-secondary hover:border-brand-border hover:text-brand-text'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-brand-text">
                        {config.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-accent/15 text-brand-accent border border-brand-accent/20">
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
              ref={startBtnRef}
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl font-mono text-xs uppercase tracking-widest font-bold btn-premium-cta btn-glow-container btn-glow-accent cta-shine cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group"
            >
              <Play className="w-4 h-4 text-brand-accent fill-brand-accent/20 group-hover:scale-110 transition-transform" />
              <span>Start Game</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
