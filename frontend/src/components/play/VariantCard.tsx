import { Link } from 'react-router';
import { ArrowRight, Shuffle } from 'lucide-react';
import BoardPreview from '../BoardPreview';
import { soundManager } from '../../utils/SoundManager';

interface VariantCardProps {
  name: string;
  tagline: string;
  href: string;
}

export function VariantCard({ name, tagline, href }: VariantCardProps) {
  return (
    <Link
      to={href}
      onClick={() => soundManager.playButtonClick()}
      className="group relative flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-brand-surface/80 border border-brand-border/60 hover:border-brand-accent/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Board Thumbnail */}
      <div className="shrink-0 group-hover:scale-105 transition-transform duration-300">
        <BoardPreview size={120} />
      </div>

      {/* Info */}
      <div className="flex-1 text-center sm:text-left space-y-2">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-brand-accent/15 text-brand-accent border border-brand-accent/30">
            Fischer Random
          </span>
          <Shuffle className="w-3.5 h-3.5 text-brand-accent" />
        </div>

        <h3 className="font-display font-bold text-2xl text-brand-text group-hover:text-brand-accent transition-colors">
          {name}
        </h3>

        <p className="text-xs text-brand-secondary/90 leading-relaxed max-w-md">
          {tagline}
        </p>
      </div>

      {/* Action Arrow */}
      <div className="shrink-0 p-3 rounded-xl bg-brand-surface/60 border border-brand-border/60 group-hover:bg-brand-accent group-hover:border-brand-accent text-brand-secondary group-hover:text-black transition-all duration-300">
        <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}
