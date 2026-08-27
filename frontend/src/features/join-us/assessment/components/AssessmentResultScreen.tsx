import { useNavigate, Link } from 'react-router';
import { Calendar, Mail, ArrowLeft } from 'lucide-react';
import { soundManager } from '@/shared/lib/SoundManager';

interface AssessmentResultScreenProps {
  status?: 'pass' | 'fail' | 'review';
  roleTitle?: string;
}

export default function AssessmentResultScreen({
  status = 'pass',
  roleTitle = 'Backend Developer',
}: AssessmentResultScreenProps) {
  const navigate = useNavigate();
  const isPass = status === 'pass';
  const isReview = status === 'review';

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full bg-brand-surface rounded-3xl border border-brand-text/15 p-8 sm:p-12 text-center space-y-8 relative overflow-hidden">
        {/* Glow effect */}
        <div
          className={`absolute top-0 right-0 w-80 h-80 blur-[120px] rounded-full pointer-events-none ${isPass || isReview ? 'bg-emerald-500/10' : 'bg-red-500/10'
            }`}
        />

        {/* Brand Header */}
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

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-brand-accent font-semibold">
            {roleTitle}
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-brand-text">
            Assessment Completed{isPass ? '!' : ''}
          </h1>
          <p className="text-lg sm:text-xl font-medium text-brand-accent">
            {isPass ? 'Congratulations!' : isReview ? 'Thank You!' : 'Thank You!'}
          </p>
        </div>

        {/* Result Message Card */}
        <div className="bg-brand-surface/70 border border-brand-text/15 rounded-2xl p-5 sm:p-6 text-brand-secondary text-sm sm:text-base leading-relaxed">
          {isPass ? (
            <p>
              You have successfully completed the assessment and have progressed to{' '}
              <strong className="text-brand-text">manual review</strong>.
            </p>
          ) : isReview ? (
            <p>
              Your answers have been submitted. We do not automatically grade this
              assessment — a member of our team will personally review your responses.
            </p>
          ) : (
            <p>
              Unfortunately, you did not meet the requirements to progress to the next
              stage of our hiring process.
            </p>
          )}
        </div>

        {/* Next Steps Cards */}
        {isPass || isReview ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="p-5 rounded-2xl bg-brand-surface/40 border border-brand-text/10 space-y-2">
              <div className="flex items-center gap-2 text-brand-accent text-sm font-semibold">
                <Calendar className="w-4 h-4" />
                <span>What happens next?</span>
              </div>
              <p className="text-xs sm:text-sm text-brand-secondary leading-relaxed">
                Our team will review your responses and get back to you within{' '}
                <span className="text-brand-text font-semibold">7 days</span>.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-brand-surface/40 border border-brand-text/10 space-y-2">
              <div className="flex items-center gap-2 text-brand-accent text-sm font-semibold">
                <Mail className="w-4 h-4" />
                <span>Questions?</span>
              </div>
              <p className="text-xs sm:text-sm text-brand-secondary leading-relaxed">
                If you have any questions, please contact us at{' '}
                <a
                  href="mailto:jimmy@xlchess.com"
                  className="text-brand-accent underline hover:text-brand-accent/80 transition-colors"
                >
                  jimmy@xlchess.com
                </a>
                .
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-brand-surface/40 border border-brand-text/10 text-center space-y-2">
            <p className="text-xs sm:text-sm text-brand-secondary leading-relaxed">
              We appreciate the time and effort you invested in completing the assessment.
              We encourage you to keep an eye on our careers page for future opportunities.
            </p>
          </div>
        )}

        {/* Reattempt note — no reattempts are currently supported. Only relevant on failure. */}
        {!isPass && !isReview && (
          <p className="text-sm sm:text-base text-brand-secondary/80 leading-relaxed">
            If you would like to reattempt this assessment, please email{' '}
            <a
              href="mailto:jimmy@xlchess.com"
              className="text-brand-accent underline hover:text-brand-accent/80 transition-colors"
            >
              jimmy@xlchess.com
            </a>{' '}
            and we will evaluate your request.
          </p>
        )}

        {/* Return Button */}
        <div className="pt-4 flex justify-center">
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
