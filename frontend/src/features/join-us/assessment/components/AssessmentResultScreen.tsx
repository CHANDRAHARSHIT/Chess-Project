import { useNavigate } from 'react-router';
import { CheckCircle2, XCircle, Calendar, Mail, Home } from 'lucide-react';
import { soundManager } from '@/shared/lib/SoundManager';

interface AssessmentResultScreenProps {
  status?: 'pass' | 'fail';
  roleTitle?: string;
}

export default function AssessmentResultScreen({
  status = 'pass',
  roleTitle = 'Backend Developer',
}: AssessmentResultScreenProps) {
  const navigate = useNavigate();
  const isPass = status === 'pass';

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full bg-brand-surface rounded-3xl border border-brand-text/15 p-8 sm:p-12 text-center space-y-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        {/* Glow effect */}
        <div
          className={`absolute top-0 right-0 w-80 h-80 blur-[120px] rounded-full pointer-events-none ${
            isPass ? 'bg-emerald-500/10' : 'bg-brand-accent/5'
          }`}
        />

        {/* Brand Header */}
        <div className="flex justify-between items-center pb-6 border-b border-brand-text/10">
          <div className="font-display font-bold text-xl sm:text-2xl tracking-wider text-brand-text">
            XL<span className="text-brand-accent">Chess</span>
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-brand-secondary">
            Assessment Status
          </span>
        </div>

        {/* Status Icon */}
        <div className="flex justify-center">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center border-2 ${
              isPass
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-brand-surface border-brand-text/30 text-brand-secondary'
            }`}
          >
            {isPass ? (
              <CheckCircle2 className="w-14 h-14" />
            ) : (
              <XCircle className="w-14 h-14" />
            )}
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-brand-accent font-semibold">
            {roleTitle}
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-brand-text">
            {isPass ? 'Assessment Completed!' : 'Assessment Completed'}
          </h1>
          <p className="text-lg sm:text-xl font-medium text-brand-accent">
            {isPass ? 'Congratulations!' : 'Thank You!'}
          </p>
        </div>

        {/* Result Message Card */}
        <div className="bg-brand-surface/70 border border-brand-text/15 rounded-2xl p-5 sm:p-6 text-brand-secondary text-sm sm:text-base leading-relaxed">
          {isPass ? (
            <p>
              You have successfully completed the assessment and have progressed to{' '}
              <strong className="text-brand-text">manual review</strong>.
            </p>
          ) : (
            <p>
              Unfortunately, you did not meet the requirements to progress to the next
              stage of our hiring process.
            </p>
          )}
        </div>

        {/* Next Steps Cards */}
        {isPass ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="p-5 rounded-2xl bg-brand-surface/40 border border-brand-text/10 space-y-2">
              <div className="flex items-center gap-2 text-brand-accent text-sm font-semibold">
                <Calendar className="w-4 h-4" />
                <span>What happens next?</span>
              </div>
              <p className="text-xs sm:text-sm text-brand-secondary leading-relaxed">
                Our engineering team will review your responses and get back to you
                within <span className="text-brand-text font-semibold">3 – 5 business days</span>.
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
                  href="mailto:careers@xlchess.com"
                  className="text-brand-accent underline hover:text-brand-accent/80 transition-colors"
                >
                  careers@xlchess.com
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

        {/* Return Button */}
        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              navigate('/');
            }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl border border-brand-text/25 text-brand-text hover:bg-brand-surface/80 hover:border-brand-accent transition-all cursor-pointer font-semibold text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
