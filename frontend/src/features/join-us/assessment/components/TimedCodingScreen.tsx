import { useState, useMemo } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Code2 } from 'lucide-react';
import { soundManager } from '@/shared/lib/SoundManager';
import type { TimedCodingConfig } from '../assessmentTypes';
import AssessmentTimer from './AssessmentTimer';
import ShortTextInput from './inputs/ShortTextInput';

interface TimedCodingScreenProps {
  config: TimedCodingConfig;
  estimatedMinutesRaw: string;
  answer: string;
  onAnswerChange: (val: string) => void;
  onBackToPrevious: () => void;
  onSubmitAssessment: () => void;
}

export default function TimedCodingScreen({
  config,
  estimatedMinutesRaw,
  answer,
  onAnswerChange,
  onBackToPrevious,
  onSubmitAssessment,
}: TimedCodingScreenProps) {
  const estimatedMinutes = parseInt(estimatedMinutesRaw, 10) || 0;
  const exceedsLimit = estimatedMinutes > config.maxEstimateMinutes;

  const allowedMinutes = estimatedMinutes + config.bonusMinutes;
  const allowedSeconds = useMemo(
    () => Math.max(allowedMinutes, 1) * 60,
    [allowedMinutes]
  );

  const [activeTabId, setActiveTabId] = useState<string>(
    config.question.supportingTabs?.[0]?.id || ''
  );

  const activeTab = config.question.supportingTabs?.find(
    (tab) => tab.id === activeTabId
  );

  // STATE A: Estimate Exceeds 90 Minutes
  if (exceedsLimit) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-brand-surface rounded-3xl border border-red-500/30 p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          {/* Subtle red background glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-500/10 blur-[90px] rounded-full pointer-events-none" />

          {/* Warning Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-brand-text">
              Estimated Time Exceeds Limit
            </h2>
            <p className="text-brand-secondary text-sm sm:text-base">
              Your estimated completion time:
            </p>
          </div>

          {/* Big Estimate Pill */}
          <div className="inline-block px-8 py-3 rounded-2xl bg-brand-surface/90 border border-brand-text/20">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-brand-accent">
              {estimatedMinutes} minutes
            </span>
          </div>

          <div className="bg-brand-surface/40 border border-brand-text/10 rounded-2xl p-5 text-left text-sm text-brand-secondary space-y-3 leading-relaxed">
            <p className="font-semibold text-brand-text">
              Your Estimate Exceeds 90 Minutes
            </p>
            <p>
              We expect a backend developer to be able to complete this task within 90 minutes. Your estimate was {estimatedMinutes} minutes.
            </p>
            <p>
              Unfortunately, we do not consider this to be a reasonable time estimate for this task, and this will be taken into consideration when evaluating your assessment.
            </p>
          </div>

          {/* Action button */}
          <div className="pt-4 flex justify-center">
            <button
              type="button"
              onClick={() => {
                soundManager.playButtonClick();
                onBackToPrevious();
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-brand-text/25 text-brand-text hover:bg-brand-surface/80 hover:border-brand-accent transition-all cursor-pointer font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Previous Question</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STATE B: Estimate <= 90 Minutes (Timed Coding Challenge)
  return (
    <div className="space-y-8">
      {/* Time Allocation Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Estimated Time Card */}
        <div className="bg-brand-surface rounded-2xl border border-brand-text/15 p-5 text-center space-y-1">
          <div className="text-xs font-mono uppercase tracking-widest text-brand-secondary">
            Your Estimated Time
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-brand-text">
            {estimatedMinutes} minutes
          </div>
        </div>

        {/* Allowed Time Card with Bonus */}
        <div className="bg-brand-accent/10 rounded-2xl border border-brand-accent/30 p-5 text-center space-y-1">
          <div className="text-xs font-mono uppercase tracking-widest text-brand-accent font-semibold">
            Allowed Time
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-brand-accent">
            {allowedMinutes} minutes
          </div>
          <div className="text-[11px] font-mono text-brand-secondary">
            (Estimate + 15 minutes)
          </div>
        </div>
      </div>

      {/* Main Coding Question Card */}
      <div className="bg-brand-surface rounded-3xl border border-brand-text/15 p-6 sm:p-8 space-y-6">
        {/* Header & Dedicated Countdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-text/10">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-brand-accent font-semibold">
              Question 11 of 11 — Final Challenge
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-text mt-0.5">
              Timed Coding Challenge
            </h2>
          </div>

          <AssessmentTimer
            initialSeconds={allowedSeconds}
            onExpire={() => {
              onSubmitAssessment();
            }}
          />
        </div>

        {/* Purpose / Instructions */}
        {config.question.purpose && (
          <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-2xl p-4 sm:p-5 space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-brand-accent font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Purpose & Instructions</span>
            </h3>
            <p className="text-xs sm:text-sm text-brand-secondary leading-relaxed whitespace-pre-line">
              {config.question.purpose}
            </p>
          </div>
        )}

        {/* Question Text */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-brand-secondary font-semibold">
            Question
          </h3>
          <div className="bg-brand-surface/50 border border-brand-text/10 rounded-2xl p-4 sm:p-5 text-brand-text text-sm sm:text-base leading-relaxed whitespace-pre-line font-sans">
            {config.question.questionText}
          </div>
        </div>

        {/* Supporting Information / Functions Definition */}
        {config.question.supportingTabs && config.question.supportingTabs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-secondary font-semibold">
              <Code2 className="w-4 h-4 text-brand-accent" />
              <span>Function / Code Information</span>
            </div>

            <div className="border border-brand-text/15 rounded-2xl overflow-hidden bg-brand-surface/40">
              <div className="flex items-center border-b border-brand-text/15 bg-brand-surface/80 px-2 pt-2 gap-1">
                {config.question.supportingTabs.map((tab) => {
                  const isActive = tab.id === activeTabId;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        soundManager.playButtonClick();
                        setActiveTabId(tab.id);
                      }}
                      className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-t-xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-brand-surface text-brand-accent border-t-2 border-brand-accent'
                          : 'text-brand-secondary hover:text-brand-text'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-brand-secondary whitespace-pre-line font-mono bg-[#080B14]">
                {activeTab?.content}
              </div>
            </div>
          </div>
        )}

        {/* Answer Input */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-brand-accent font-semibold">
            Your Output Answer
          </h3>

          <ShortTextInput
            id="timed-coding-answer-input"
            value={answer}
            onChange={onAnswerChange}
            wordLimit={config.question.wordLimit || 1}
            placeholder={config.question.placeholder || 'Enter output value'}
          />
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-brand-text/10">
          <button
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              onBackToPrevious();
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-brand-text/25 text-brand-text hover:bg-brand-surface/80 transition-colors cursor-pointer w-full sm:w-auto justify-center text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Question</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              onSubmitAssessment();
            }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-accent text-brand-bg font-bold hover:bg-brand-accent/90 transition-transform active:scale-95 shadow-[0_0_20px_rgba(212,175,110,0.3)] cursor-pointer w-full sm:w-auto justify-center text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete Assessment</span>
          </button>
        </div>
      </div>
    </div>
  );
}
