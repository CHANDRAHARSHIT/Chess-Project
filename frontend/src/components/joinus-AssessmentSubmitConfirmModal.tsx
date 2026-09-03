import { AlertTriangle, ArrowLeft, Send } from 'lucide-react';
import { soundManager } from '@/lib/SoundManager';
import { pluralize } from '@/lib/pluralize';

interface AssessmentSubmitConfirmModalProps {
  unattemptedQuestionNumbers: number[];
  onJumpToQuestion: (qNum: number) => void;
  onSubmitAnyway: () => void;
  onClose: () => void;
}

export default function AssessmentSubmitConfirmModal({
  unattemptedQuestionNumbers,
  onJumpToQuestion,
  onSubmitAnyway,
  onClose,
}: AssessmentSubmitConfirmModalProps) {
  const count = unattemptedQuestionNumbers.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-confirm-title"
    >
      <div className="w-full max-w-lg bg-brand-surface rounded-3xl border border-brand-text/15 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-brand-accent/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-brand-accent" />
          </div>
          <div>
            <h2
              id="submit-confirm-title"
              className="text-xl sm:text-2xl font-display font-bold text-brand-text"
            >
              {count} {pluralize(count, 'question')} not attempted
            </h2>
            <p className="text-sm sm:text-base text-brand-secondary mt-1">
              Would you like to attempt them, or submit what you have?
            </p>
          </div>
        </div>

        {/* Unattempted question badges */}
        <div className="flex flex-wrap gap-2">
          {unattemptedQuestionNumbers.map((qNum) => (
            <span
              key={qNum}
              className="inline-flex items-center justify-center h-10 min-w-10 px-3 rounded-xl border border-brand-accent/40 bg-brand-accent/10 text-brand-accent text-sm font-mono font-semibold select-none"
            >
              Q{qNum}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-brand-text/10">
          <button
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
              onJumpToQuestion(unattemptedQuestionNumbers[0]);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-brand-text/25 text-brand-text hover:bg-brand-surface/80 hover:border-brand-accent transition-all cursor-pointer w-full sm:w-auto justify-center text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Review Answers</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              onSubmitAnyway();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-accent text-brand-bg font-bold hover:bg-brand-accent/90 transition-transform active:scale-95 cursor-pointer w-full sm:w-auto justify-center text-sm"
          >
            <Send className="w-4 h-4" />
            <span>Submit Anyway</span>
          </button>
        </div>
      </div>
    </div>
  );
}
