import React from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { soundManager } from '@/shared/lib/SoundManager';
import QuestionNavigator from './QuestionNavigator';
import MobileQuestionNav from './MobileQuestionNav';
import type { AssessmentQuestion } from '../assessmentTypes';

interface AssessmentShellProps {
  roleTitle: string;
  totalQuestions: number;
  currentQuestionNumber: number;
  answeredQuestionNumbers: Set<number>;
  bookmarkedQuestionNumbers: Set<number>;
  /** Question numbers that can't be jumped to yet (e.g. Q11 before the Q10 estimate is submitted). */
  lockedQuestionNumbers?: Set<number>;
  activeQuestion?: AssessmentQuestion;
  pagePurpose?: string;
  submitButtonText?: string;
  isFirstPage: boolean;
  /** True while Q11's timer is running — the candidate can't leave it until they finish or time runs out. */
  previousDisabled?: boolean;
  isLastPage: boolean;
  onNavigateToQuestion: (qNum: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  children: React.ReactNode;
}

export default function AssessmentShell({
  roleTitle,
  totalQuestions,
  currentQuestionNumber,
  answeredQuestionNumbers,
  bookmarkedQuestionNumbers,
  lockedQuestionNumbers,
  activeQuestion,
  pagePurpose,
  submitButtonText = 'Save & Continue',
  isFirstPage,
  previousDisabled = false,
  isLastPage: _isLastPage,
  onNavigateToQuestion,
  onPreviousPage,
  onNextPage,
  children,
}: AssessmentShellProps) {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col relative pb-20 overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-accent/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Fixed Header */}
      <header className="sticky top-0 z-40 bg-brand-bg/90 backdrop-blur-md border-b border-brand-text/15 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Assessment Title */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              onClick={() => soundManager.playButtonClick()}
              aria-label="Go to XLChess home"
              className="shrink-0"
            >
              <img
                src="/logo-without-text.png"
                alt="XLChess logo"
                className="h-9 w-auto object-contain"
                draggable={false}
              />
            </Link>
            <div className="h-5 w-px bg-brand-text/20" />
            <div className="flex flex-col">
              <span className="text-xs font-mono uppercase tracking-wider text-brand-accent font-semibold">
                Assessment
              </span>
              <span className="text-xs text-brand-secondary hidden sm:inline truncate max-w-xs">
                {roleTitle}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6 sm:pt-8 flex-1 relative z-10 space-y-6">
        {/* Page Purpose Callout (if present) */}
        {pagePurpose && (
          <div className="bg-brand-surface/80 rounded-2xl border border-brand-text/15 p-5 backdrop-blur-sm">
            <h3 className="text-xs font-mono uppercase tracking-wider text-brand-accent font-semibold mb-1">
              Purpose
            </h3>
            <p className="text-sm text-brand-secondary leading-relaxed whitespace-pre-line">
              {pagePurpose}
            </p>
          </div>
        )}

        {/* Mobile Question Navigator — above the question, not below it */}
        <div className="lg:hidden">
          <MobileQuestionNav
            totalQuestions={totalQuestions}
            currentQuestionNumber={currentQuestionNumber}
            answeredQuestionNumbers={answeredQuestionNumbers}
            bookmarkedQuestionNumbers={bookmarkedQuestionNumbers}
            lockedQuestionNumbers={lockedQuestionNumbers}
            onNavigateToQuestion={onNavigateToQuestion}
            activeQuestion={activeQuestion}
          />
        </div>

        {/* Two-Column Grid: Questions on Left, Navigator on Right (Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Questions List */}
          <div className="lg:col-span-8 space-y-6">{children}</div>

          {/* Right Column: Question Navigator (Desktop Sticky) */}
          <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <QuestionNavigator
              totalQuestions={totalQuestions}
              currentQuestionNumber={currentQuestionNumber}
              answeredQuestionNumbers={answeredQuestionNumbers}
              bookmarkedQuestionNumbers={bookmarkedQuestionNumbers}
              lockedQuestionNumbers={lockedQuestionNumbers}
              onNavigateToQuestion={onNavigateToQuestion}
              activeQuestion={activeQuestion}
            />
          </div>
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-brand-text/15">
          {!isFirstPage ? (
            <button
              type="button"
              disabled={previousDisabled}
              onClick={() => {
                if (previousDisabled) return;
                soundManager.playButtonClick();
                onPreviousPage();
              }}
              title={previousDisabled ? "You can't leave this question until the timer runs out" : undefined}
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border transition-colors w-full sm:w-auto justify-center text-sm font-semibold group ${
                previousDisabled
                  ? 'border-brand-text/10 text-brand-secondary/40 cursor-not-allowed'
                  : 'border-brand-text/25 text-brand-text hover:bg-brand-surface/80 cursor-pointer'
              }`}
            >
              <ArrowLeft
                className={`w-4 h-4 transition-transform ${
                  previousDisabled ? '' : 'group-hover:-translate-x-1'
                }`}
              />
              <span>Previous</span>
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          <button
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              onNextPage();
            }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-accent text-brand-bg font-bold hover:bg-brand-accent/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(212,175,110,0.25)] cursor-pointer w-full sm:w-auto justify-center text-sm group"
          >
            <span>{submitButtonText}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </main>
    </div>
  );
}
