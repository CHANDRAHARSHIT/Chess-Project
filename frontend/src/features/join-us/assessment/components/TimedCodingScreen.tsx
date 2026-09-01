import { useState, useEffect } from "react";
import { AlertTriangle, ArrowLeft, Clock, Code2 } from "lucide-react";
import { soundManager } from "@/shared/lib/SoundManager";
import type { TimedCodingConfig } from "../assessmentTypes";
import CodeBlock from "./CodeBlock";
import ShortTextInput from "./inputs/ShortTextInput";
import { pluralize } from "@/shared/lib/pluralize";

interface TimedCodingScreenProps {
  config: TimedCodingConfig;
  estimatedMinutesRaw: string;
  answer: string;
  onAnswerChange: (val: string) => void;
  onBackToPrevious: () => void;
  /**
   * Absolute deadline (ISO string) from the server — null while the estimate
   * hasn't been submitted yet. Display-only for now: running out has no
   * consequence (no auto-submit) until the "go back to a previous question"
   * interaction with a global deadline is redesigned properly.
   */
  deadlineAt: string | null;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function TimedCodingScreen({
  config,
  estimatedMinutesRaw,
  answer,
  onAnswerChange,
  onBackToPrevious,
  deadlineAt,
}: TimedCodingScreenProps) {
  const estimatedMinutes = parseInt(estimatedMinutesRaw, 10) || 0;
  const exceedsLimit = estimatedMinutes > config.maxEstimateMinutes;

  // Countdown is derived from the server's absolute deadline timestamp, never
  // stored as a ticking duration — remaining time is always `deadline - now`.
  // Purely informational: running out has no consequence right now.
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      if (!deadlineAt) {
        setRemainingMs(null);
        return;
      }
      setRemainingMs(new Date(deadlineAt).getTime() - Date.now());
    };

    tick();
    if (!deadlineAt) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadlineAt]);

  const isDanger = remainingMs !== null && remainingMs <= 5 * 60_000;

  const [activeTabId, setActiveTabId] = useState<string>(
    config.question.supportingTabs?.[0]?.id || "",
  );

  const activeTab = config.question.supportingTabs?.find(
    (tab) => tab.id === activeTabId,
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
              {estimatedMinutes} {pluralize(estimatedMinutes, "minute")}
            </span>
          </div>

          <div className="bg-brand-surface/40 border border-brand-text/10 rounded-2xl p-5 text-left text-sm text-brand-secondary space-y-3 leading-relaxed">
            <p className="font-semibold text-brand-text">
              Your Estimate Exceeds 90 Minutes
            </p>
            <p>
              We expect a backend developer to be able to complete this task
              within 90 minutes. Your estimate was {estimatedMinutes}{" "}
              {pluralize(estimatedMinutes, "minute")}.
            </p>
            <p>
              Unfortunately, we do not consider this to be a reasonable time
              estimate for this task, and this will be taken into consideration
              when evaluating your assessment.
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
      <div className="bg-brand-accent/10 rounded-2xl border border-brand-accent/30 p-5 text-center space-y-1">
        <div className="text-xs font-mono uppercase tracking-widest text-brand-accent font-semibold">
          Your Time Allotted
        </div>
        <div className="text-2xl sm:text-3xl font-mono font-bold text-brand-accent">
          {estimatedMinutes} {pluralize(estimatedMinutes, "minute")}
        </div>
        <div className="text-[11px] font-mono text-brand-secondary">
          (As estimated in the previous question)
        </div>
      </div>

      {/* Main Coding Question Card */}
      <div
        id={`question-${config.question.questionNumber}`}
        className="bg-brand-surface rounded-3xl border border-brand-text/15 p-6 sm:p-8 space-y-6 scroll-mt-28"
      >
        {/* Header & Countdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-text/10">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-brand-accent font-semibold">
              Question 11 of 11 — Final Challenge
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-text mt-0.5">
              Timed Coding Challenge
            </h2>
          </div>

          {remainingMs !== null && (
            <div
              className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border select-none ${
                isDanger
                  ? "bg-red-500/15 border-red-500/40 text-red-400"
                  : "bg-brand-surface/80 border-brand-text/15 text-brand-text"
              }`}
            >
              <Clock
                className={`w-5 h-5 ${isDanger ? "text-red-400" : "text-brand-accent"}`}
              />
              <div className="flex flex-col text-right">
                <span className="font-mono text-base font-bold tracking-wider leading-none">
                  {formatRemaining(remainingMs)}
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-brand-secondary/80 mt-0.5">
                  Time Remaining
                </span>
              </div>
            </div>
          )}
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
          <div className="bg-brand-surface/50 border border-brand-text/10 rounded-2xl p-4 sm:p-5 text-brand-text text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
            {config.question.questionText}
          </div>
        </div>

        {/* Trace Snippet — its own code block, separate from the Functions Definition below */}
        {config.question.traceCode && (
          <div className="rounded-2xl border border-brand-text/20 overflow-hidden shadow-inner">
            <CodeBlock
              code={config.question.traceCode}
              language={config.question.codeLanguage}
            />
          </div>
        )}

        {/* Read-Only Code Block — always visible, matches Q7's layout */}
        {config.question.codeBlock && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-secondary font-semibold">
              <Code2 className="w-4 h-4 text-brand-accent" />
              <span>Function / Code Information</span>
            </div>
            <div className="rounded-2xl border border-brand-text/20 overflow-hidden shadow-inner">
              <CodeBlock
                code={config.question.codeBlock}
                language={config.question.codeLanguage}
              />
            </div>
          </div>
        )}

        {/* Any remaining prose-only supporting tabs (kept for future non-code tabs) */}
        {config.question.supportingTabs &&
          config.question.supportingTabs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-brand-secondary font-semibold">
                Supporting Information
              </h3>

              <div className="border border-brand-text/15 rounded-2xl overflow-hidden bg-brand-surface/40">
                <div className="flex items-center border-b border-brand-text/15 bg-brand-surface/80 px-2 pt-2 gap-1 overflow-x-auto">
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
                            ? "bg-brand-surface text-brand-accent"
                            : "text-brand-secondary hover:text-brand-text"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {activeTab?.isCode ? (
                  <CodeBlock code={activeTab.content} showHeader={false} />
                ) : (
                  <div className="p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-brand-secondary whitespace-pre-wrap font-mono bg-brand-bg">
                    {activeTab?.content}
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Answer Input */}
        <div className="space-y-3 pt-2">
          <ShortTextInput
            id="timed-coding-answer-input"
            value={answer}
            onChange={onAnswerChange}
            wordLimit={config.question.wordLimit || 1}
            placeholder={config.question.placeholder || "Answer"}
          />
        </div>
      </div>
    </div>
  );
}
