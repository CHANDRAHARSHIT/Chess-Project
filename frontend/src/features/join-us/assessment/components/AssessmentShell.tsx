import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { soundManager } from '@/shared/lib/SoundManager';
import AssessmentTimer from './AssessmentTimer';
import ProgressBar from './ProgressBar';
import QuestionNavigator from './QuestionNavigator';
import type { AssessmentQuestion } from '../assessmentTypes';

interface AssessmentShellProps {
  roleTitle: string;
  totalTimeMinutes: number;
  totalQuestions: number;
  currentQuestionNumber: number;
  answeredQuestionNumbers: Set<number>;
  bookmarkedQuestionNumbers: Set<number>;
  activeQuestion?: AssessmentQuestion;
  pagePurpose?: string;
  submitButtonText?: string;
  isFirstPage: boolean;
  isLastPage: boolean;
  onNavigateToQuestion: (qNum: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onTimerExpire?: () => void;
  children: React.ReactNode;
}

export default function AssessmentShell({
  roleTitle,
  totalTimeMinutes,
  totalQuestions,
  currentQuestionNumber,
  answeredQuestionNumbers,
  bookmarkedQuestionNumbers,
  activeQuestion,
  pagePurpose,
  submitButtonText = 'Save & Continue',
  isFirstPage,
  isLastPage: _isLastPage,
  onNavigateToQuestion,
  onPreviousPage,
  onNextPage,
  onTimerExpire,
  children,
}: AssessmentShellProps) {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col relative pb-20">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-accent/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Fixed Header */}
      <header className="sticky top-0 z-40 bg-brand-bg/90 backdrop-blur-md border-b border-brand-text/15 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Assessment Title */}
          <div className="flex items-center gap-3">
            <div className="font-display font-bold text-xl sm:text-2xl tracking-wider text-brand-text">
              XL<span className="text-brand-accent">Chess</span>
            </div>
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

          {/* Global Countdown Timer */}
          <AssessmentTimer
            initialSeconds={totalTimeMinutes * 60}
            onExpire={onTimerExpire}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6 sm:pt-8 flex-1 relative z-10 space-y-6">
        {/* Progress Bar Section */}
        <div className="bg-brand-surface/70 rounded-2xl border border-brand-text/15 p-4 sm:p-5 backdrop-blur-sm">
          <ProgressBar
            currentQuestion={currentQuestionNumber}
            totalQuestions={totalQuestions}
          />
        </div>

        {/* Page Purpose Callout (if present) */}
        {pagePurpose && (
          <div className="bg-brand-surface/80 rounded-2xl border border-brand-text/15 p-5 border-l-4 border-l-brand-accent backdrop-blur-sm">
            <h3 className="text-xs font-mono uppercase tracking-wider text-brand-accent font-semibold mb-1">
              Purpose
            </h3>
            <p className="text-sm text-brand-secondary leading-relaxed whitespace-pre-line">
              {pagePurpose}
            </p>
          </div>
        )}

        {/* Two-Column Grid: Questions on Left, Navigator on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Questions List */}
          <div className="lg:col-span-8 space-y-6">{children}</div>

          {/* Right Column: Question Navigator (Desktop Sticky) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <QuestionNavigator
              totalQuestions={totalQuestions}
              currentQuestionNumber={currentQuestionNumber}
              answeredQuestionNumbers={answeredQuestionNumbers}
              bookmarkedQuestionNumbers={bookmarkedQuestionNumbers}
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
              onClick={() => {
                soundManager.playButtonClick();
                onPreviousPage();
              }}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-brand-text/25 text-brand-text hover:bg-brand-surface/80 transition-colors cursor-pointer w-full sm:w-auto justify-center text-sm font-semibold group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
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
