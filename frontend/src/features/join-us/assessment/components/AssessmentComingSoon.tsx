import { useNavigate } from 'react-router';
import { ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { soundManager } from '@/shared/lib/SoundManager';

interface AssessmentComingSoonProps {
  roleTitle?: string;
  department?: string;
}

export default function AssessmentComingSoon({
  roleTitle,
  department = 'Department',
}: AssessmentComingSoonProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-brand-surface rounded-3xl border border-brand-text/15 p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center">
          <Clock className="w-10 h-10 text-brand-accent" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand-accent/30 bg-brand-accent/5 text-xs font-mono text-brand-accent uppercase tracking-wider font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Assessment in Development</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-display font-bold text-brand-text">
            Coming Soon
          </h1>

          <p className="text-brand-secondary text-sm sm:text-base leading-relaxed pt-2">
            The assessment portal for{' '}
            <span className="text-brand-accent font-semibold">
              {roleTitle || `${department} Openings`}
            </span>{' '}
            is currently being finalized. Please check back shortly or explore our
            other active openings.
          </p>
        </div>

        {/* Back Button */}
        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              navigate('/join-us');
            }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-accent text-brand-bg font-bold hover:bg-brand-accent/90 transition-transform active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(212,175,110,0.2)] text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Careers</span>
          </button>
        </div>
      </div>
    </div>
  );
}
