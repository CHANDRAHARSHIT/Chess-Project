import { Clock, ArrowLeft, PlayCircle } from 'lucide-react';
import { soundManager } from '@/shared/lib/SoundManager';
import { pluralize } from '@/shared/lib/pluralize';

interface TimedSectionWarningModalProps {
  estimatedMinutes: number;
  onGoBack: () => void;
  onProceed: () => void;
  proceeding?: boolean;
}

/**
 * Blocks entry into Q11 until the candidate explicitly acknowledges that
 * viewing it starts the clock. Shown once per attempt — after onProceed
 * fires, startTimedSection is stamped server-side and this never appears
 * again for this attempt, even on revisit.
 */
export default function TimedSectionWarningModal({
  estimatedMinutes,
  onGoBack,
  onProceed,
  proceeding = false,
}: TimedSectionWarningModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="timed-section-warning-title"
    >
      <div className="w-full max-w-lg bg-brand-surface rounded-3xl border border-brand-text/15 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-brand-accent/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-brand-accent" />
          </div>
          <div>
            <h2
              id="timed-section-warning-title"
              className="text-xl sm:text-2xl font-display font-bold text-brand-text"
            >
              You're about to start a timed question
            </h2>
            <p className="text-sm sm:text-base text-brand-secondary mt-1 leading-relaxed">
              You are proceeding to a time-based question. Make sure you have the full{' '}
              <span className="font-semibold text-brand-text">
                {estimatedMinutes} {pluralize(estimatedMinutes, 'minute')}
              </span>{' '}
              available to complete this question. The timer will start once you view Question 11.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-brand-text/10">
          <button
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              onGoBack();
            }}
            disabled={proceeding}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-brand-text/25 text-brand-text hover:bg-brand-surface/80 hover:border-brand-accent transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto justify-center text-sm font-semibold whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              onProceed();
            }}
            disabled={proceeding}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-accent text-brand-bg font-bold hover:bg-brand-accent/90 transition-transform active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto justify-center text-sm whitespace-nowrap"
          >
            <PlayCircle className="w-4 h-4" />
            <span>{proceeding ? 'Starting...' : 'Start the Timer'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
