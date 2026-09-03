import { Link } from 'react-router';
import { ArrowRight, Shuffle, Sparkles, Lock } from 'lucide-react';
import BoardPreview from '@/components/ui-BoardPreview';
import { soundManager } from '@/lib/SoundManager';

export interface VariantCardProps {
  id: string;
  name: string;
  tagline: string;
  href: string;
  categoryTag?: string;
  tags?: string[];
  isPlayable?: boolean;
  badge?: string;
}

export function VariantCard({
  name,
  tagline,
  href,
  categoryTag = 'Fischer Random',
  tags = ['960 Positions', 'Stockfish Bot', 'Rated Play'],
  isPlayable = true,
  badge = 'PLAYABLE NOW',
}: VariantCardProps) {
  const content = (
    <div
      className={`group relative flex flex-col md:flex-row items-center gap-6 p-6 sm:p-7 rounded-3xl backdrop-blur-xl border transition-all duration-300 ${
        isPlayable
          ? 'bg-brand-surface border-brand-text/15 hover:border-brand-accent/50 hover:-translate-y-1'
          : 'bg-brand-surface/60 border-brand-text/10 opacity-80 hover:opacity-100 hover:border-brand-text/20 hover:bg-brand-surface/80'
      }`}
    >
      {/* Background Subtle Gradient Glow */}
      {isPlayable && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-brand-accent/5 via-transparent to-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}

      {/* Board Thumbnail Container */}
      <div className="relative shrink-0 p-2.5 rounded-2xl bg-brand-surface border border-brand-text/15 group-hover:scale-105 group-hover:border-brand-accent/40 transition-all duration-300">
        <BoardPreview size={128} />
        {isPlayable && (
          <div className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </div>
        )}
      </div>

      {/* Main Info */}
      <div className="flex-1 text-center md:text-left space-y-3 min-w-0">
        {/* Header Tags */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold bg-brand-accent/10 border border-brand-accent/30 text-brand-accent flex items-center gap-1.5">
            <Shuffle className="w-3 h-3 text-brand-accent" />
            {categoryTag}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold ${
              isPlayable
                ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-brand-secondary/15 text-brand-secondary border border-brand-text/10'
            }`}
          >
            {badge}
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-brand-text group-hover:text-brand-accent transition-colors tracking-tight flex items-center justify-center md:justify-start gap-2">
            <span>{name}</span>
            {isPlayable && (
              <Sparkles className="w-4 h-4 text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </h3>
          <p className="text-xs sm:text-sm text-brand-secondary leading-relaxed max-w-xl">
            {tagline}
          </p>
        </div>

        {/* Feature Tags Pill Row */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-md text-[11px] font-mono text-brand-secondary bg-brand-text/5 border border-brand-text/10"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action CTA */}
      <div className="shrink-0 pt-2 md:pt-0">
        {isPlayable ? (
          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-text/5 border border-brand-text/15 group-hover:bg-brand-accent group-hover:border-brand-accent text-brand-text group-hover:text-black transition-all duration-300 font-mono text-xs font-bold uppercase tracking-wider">
            <span>Play Now</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-text/5 border border-brand-text/10 text-brand-secondary/60 text-xs font-mono font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>In Lab</span>
          </div>
        )}
      </div>
    </div>
  );

  if (!isPlayable) {
    return <div className="cursor-not-allowed select-none">{content}</div>;
  }

  return (
    <Link
      to={href}
      onClick={() => soundManager.playButtonClick()}
      className="block text-left"
    >
      {content}
    </Link>
  );
}
