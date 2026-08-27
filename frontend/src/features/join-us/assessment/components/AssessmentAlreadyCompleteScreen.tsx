import { useNavigate, Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { soundManager } from '@/shared/lib/SoundManager';
import type { AssessmentResultStatus } from '../assessment.service';

interface AssessmentAlreadyCompleteScreenProps {
  result: AssessmentResultStatus;
  submittedAt: string | null;
}

function describeOutcome(result: AssessmentResultStatus): string {
  if (result === 'PASS') return 'passed and is currently awaiting manual review';
  if (result === 'FAIL') return 'failed and reattempts are not currently allowed';
  return 'was submitted and is currently awaiting manual review';
}

export default function AssessmentAlreadyCompleteScreen({
  result,
  submittedAt,
}: AssessmentAlreadyCompleteScreenProps) {
  const navigate = useNavigate();
  const submittedAtLabel = submittedAt
    ? new Date(submittedAt).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    : 'a previous date';

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-brand-surface rounded-3xl border border-brand-text/15 p-8 sm:p-10 text-center space-y-6 relative overflow-hidden">
        <div className="flex justify-center pb-6 border-b border-brand-text/10">
          <Link to="/" onClick={() => soundManager.playButtonClick()} aria-label="Go to XLChess home">
            <img
              src="/logo-without-text.png"
              alt="XLChess logo"
              className="h-9 w-auto object-contain"
              draggable={false}
            />
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-bold text-brand-text">
          Assessment Already Complete
        </h1>

        <p className="text-sm sm:text-base text-brand-secondary leading-relaxed">
          Looks like you already took the assessment on{' '}
          <span className="text-brand-text font-semibold">{submittedAtLabel}</span>. Your
          attempt {describeOutcome(result)}. If you'd like to get in touch, please use our{' '}
          <a href="/contact-us" className="text-brand-accent underline hover:text-brand-accent/80">
            Contact Us
          </a>{' '}
          page.
        </p>

        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              navigate('/join-us');
            }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl border border-brand-text/25 text-brand-text hover:bg-brand-surface/80 hover:border-brand-accent transition-all cursor-pointer font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Join Us</span>
          </button>
        </div>
      </div>
    </div>
  );
}
