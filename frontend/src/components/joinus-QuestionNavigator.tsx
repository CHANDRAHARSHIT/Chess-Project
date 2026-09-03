import { soundManager } from "@/lib/SoundManager";
import { Bookmark } from "lucide-react";
import type { AssessmentQuestion } from "@/types/joinus-assessmentTypes";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentQuestionNumber: number;
  answeredQuestionNumbers: Set<number>;
  bookmarkedQuestionNumbers: Set<number>;
  /** Question numbers that can't be jumped to yet (e.g. Q11 before the Q10 estimate is submitted). */
  lockedQuestionNumbers?: Set<number>;
  onNavigateToQuestion: (qNum: number) => void;
  activeQuestion?: AssessmentQuestion;
}

/** Desktop question navigator — full legend + grid + tips card. See MobileQuestionNav for the small-screen equivalent. */
export default function QuestionNavigator({
  totalQuestions,
  currentQuestionNumber,
  answeredQuestionNumbers,
  bookmarkedQuestionNumbers,
  lockedQuestionNumbers,
  onNavigateToQuestion,
  activeQuestion: _activeQuestion,
}: QuestionNavigatorProps) {
  return (
    <div className="space-y-6">
      {/* Question Navigator Card */}
      <div className="bg-brand-surface rounded-2xl border border-brand-text/15 p-5">
        <h3 className="text-sm font-semibold font-display text-brand-text tracking-wide mb-4">
          Question Navigator
        </h3>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-brand-secondary mb-5 pb-4 border-b border-brand-text/10">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-brand-accent/30 border border-brand-accent/60" />
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-brand-accent text-brand-bg flex items-center justify-center font-bold text-[9px]">
              ●
            </span>
            <span>Current</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-brand-surface border border-brand-text/25" />
            <span>Not Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span>Review Later</span>
          </div>
        </div>

        {/* Question Numbers Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(
            (qNum) => {
              const isCurrent = qNum === currentQuestionNumber;
              const isAnswered = answeredQuestionNumbers.has(qNum);
              const isBookmarked = bookmarkedQuestionNumbers.has(qNum);
              const isLocked = lockedQuestionNumbers?.has(qNum) ?? false;

              let buttonStyle =
                "bg-brand-surface/70 border-brand-text/20 text-brand-secondary hover:border-brand-text/40 hover:text-brand-text";

              if (isCurrent) {
                buttonStyle =
                  "bg-brand-accent text-brand-bg font-bold border-brand-accent shadow-[0_0_12px_rgba(212,175,110,0.3)] ring-2 ring-brand-accent/40 ring-offset-2 ring-offset-brand-bg";
              } else if (isAnswered) {
                buttonStyle =
                  "bg-brand-accent/20 border-brand-accent/60 text-brand-text font-semibold";
              }

              if (isLocked) {
                buttonStyle =
                  "bg-brand-surface/40 border-brand-text/10 text-brand-secondary/40 cursor-not-allowed";
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
                  className={`relative flex items-center justify-center h-10 rounded-xl border text-sm font-mono transition-all duration-200 cursor-pointer ${buttonStyle}`}
                  aria-label={
                    isLocked
                      ? `Question ${qNum} is currently locked`
                      : `Jump to Question ${qNum}${isCurrent ? " (Current)" : ""}${
                          isAnswered ? " (Answered)" : ""
                        }${isBookmarked ? " (Bookmarked)" : ""}`
                  }
                >
                  <span>{qNum}</span>

                  {isBookmarked && !isLocked && (
                    <span className="absolute -bottom-1 -right-1">
                      <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </span>
                  )}
                </button>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}
