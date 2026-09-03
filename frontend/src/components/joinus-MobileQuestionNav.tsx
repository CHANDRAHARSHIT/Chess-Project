import { soundManager } from '@/lib/SoundManager';
import { Bookmark, HelpCircle } from 'lucide-react';
import type { AssessmentQuestion } from '@/types/joinus-assessmentTypes';
import { getQuestionTypeLabel } from '@/utils/joinus-questionTypeLabel';

interface MobileQuestionNavProps {
  totalQuestions: number;
  currentQuestionNumber: number;
  answeredQuestionNumbers: Set<number>;
  bookmarkedQuestionNumbers: Set<number>;
  /** Question numbers that can't be jumped to yet (e.g. Q11 before the Q10 estimate is submitted). */
  lockedQuestionNumbers?: Set<number>;
  onNavigateToQuestion: (qNum: number) => void;
  activeQuestion?: AssessmentQuestion;
}

/**
 * Compact, mobile-only question navigator — a horizontally scrollable strip
 * of question pills plus the current question's tip, placed above the
 * question content instead of below it (the desktop QuestionNavigator sits
 * in a sidebar, which on a single-column mobile layout would otherwise land
 * far below a long question — a full scroll away from the very thing meant
 * to help you jump around).
 */
export default function MobileQuestionNav({
  totalQuestions,
  currentQuestionNumber,
  answeredQuestionNumbers,
  bookmarkedQuestionNumbers,
  lockedQuestionNumbers,
  onNavigateToQuestion,
  activeQuestion,
}: MobileQuestionNavProps) {
  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-text/15 overflow-hidden">
      {/* Horizontally scrollable question pills */}
      <div className="flex items-center gap-2 p-3 overflow-x-auto">
        {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((qNum) => {
          const isCurrent = qNum === currentQuestionNumber;
          const isAnswered = answeredQuestionNumbers.has(qNum);
          const isBookmarked = bookmarkedQuestionNumbers.has(qNum);
          const isLocked = lockedQuestionNumbers?.has(qNum) ?? false;

          let buttonStyle =
            'bg-brand-surface/70 border-brand-text/20 text-brand-secondary';
          if (isCurrent) {
            buttonStyle =
              'bg-brand-accent text-brand-bg font-bold border-brand-accent shadow-[0_0_10px_rgba(212,175,110,0.3)]';
          } else if (isAnswered) {
            buttonStyle = 'bg-brand-accent/20 border-brand-accent/60 text-brand-text font-semibold';
          }
          if (isLocked) {
            buttonStyle = 'bg-brand-surface/40 border-brand-text/10 text-brand-secondary/40 cursor-not-allowed';
          }

          return (
            <button
              key={qNum}
              type="button"
              aria-disabled={isLocked}
              onClick={() => {
                // Locked clicks still fire — onNavigateToQuestion decides
                // what happens (e.g. Q11 redirects to Q10 with a prompt
                // instead of doing nothing).
                soundManager.playButtonClick();
                onNavigateToQuestion(qNum);
              }}
              className={`relative flex items-center justify-center h-10 w-10 shrink-0 rounded-xl border text-sm font-mono transition-all duration-200 cursor-pointer ${buttonStyle}`}
              aria-label={
                isLocked
                  ? `Question ${qNum} is currently locked`
                  : `Jump to Question ${qNum}${isCurrent ? ' (Current)' : ''}${
                      isAnswered ? ' (Answered)' : ''
                    }${isBookmarked ? ' (Bookmarked)' : ''}`
              }
            >
              <span>{qNum}</span>
              {isBookmarked && !isLocked && (
                <span className="absolute -bottom-1 -right-1">
                  <Bookmark className="w-3 h-3 text-amber-400 fill-amber-400" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Current question's type + tip, always visible without scrolling */}
      {activeQuestion && (
        <div className="px-4 py-3 border-t border-brand-text/10 flex items-start justify-between gap-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-brand-secondary shrink-0 pt-0.5">
            {getQuestionTypeLabel(activeQuestion.type)}
          </span>
        </div>
      )}

      {activeQuestion?.tips && (
        <div className="px-4 py-3 border-t border-brand-text/10 bg-brand-accent/5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-accent mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tips</span>
          </div>
          <p className="text-xs text-brand-secondary leading-relaxed">{activeQuestion.tips}</p>
        </div>
      )}
    </div>
  );
}
