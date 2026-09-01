import { useState } from "react";
import { Bookmark, Info, Code2 } from "lucide-react";
import { soundManager } from "@/shared/lib/SoundManager";
import type { AssessmentQuestion } from "../assessmentTypes";
import CodeBlock from "./CodeBlock";
import ShortTextInput from "./inputs/ShortTextInput";
import LongTextInput from "./inputs/LongTextInput";
import MultipleChoiceInput from "./inputs/MultipleChoiceInput";
import CheckboxGroupInput from "./inputs/CheckboxGroupInput";
import RadioWithTextInput from "./inputs/RadioWithTextInput";
import NumberInput from "./inputs/NumberInput";
import CodeInput from "./inputs/CodeInput";

interface QuestionCardProps {
  question: AssessmentQuestion;
  totalQuestions: number;
  answer: string;
  onAnswerChange: (val: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  // For radio-with-text composite answers (stored e.g. as JSON or joined string)
  radioValue?: string;
  textValue?: string;
  onRadioValueChange?: (val: string) => void;
  onTextValueChange?: (val: string) => void;
  /** Locks the answer input — used for the Q10 time estimate once it's been submitted and can't be changed. */
  disabled?: boolean;
  disabledNote?: string;
}

export default function QuestionCard({
  question,
  totalQuestions,
  answer,
  onAnswerChange,
  isBookmarked,
  onToggleBookmark,
  radioValue = "",
  textValue = "",
  onRadioValueChange,
  onTextValueChange,
  disabled = false,
  disabledNote,
}: QuestionCardProps) {
  const [activeTabId, setActiveTabId] = useState<string>(
    question.supportingTabs?.[0]?.id || "",
  );

  const activeTab = question.supportingTabs?.find(
    (tab) => tab.id === activeTabId,
  );

  return (
    <div
      id={`question-${question.questionNumber}`}
      className="bg-brand-surface rounded-3xl border border-brand-text/15 p-6 sm:p-8 space-y-6 relative overflow-hidden backdrop-blur-sm scroll-mt-28"
    >
      {/* Question Header */}
      <div className="flex items-center justify-between pb-4 border-b border-brand-text/10">
        <span className="text-xs font-mono uppercase tracking-widest text-brand-accent font-semibold">
          Question {question.questionNumber} of {totalQuestions}
        </span>

        {/* Bookmark button */}
        <button
          type="button"
          onClick={() => {
            soundManager.playButtonClick();
            onToggleBookmark();
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all duration-200 cursor-pointer ${
            isBookmarked
              ? "bg-amber-500/15 border-amber-500/50 text-amber-400"
              : "bg-brand-surface border-brand-text/15 text-brand-secondary hover:text-brand-text hover:border-brand-text/30"
          }`}
          aria-label={
            isBookmarked ? "Remove bookmark" : "Bookmark question for later"
          }
        >
          <Bookmark
            className={`w-4 h-4 ${
              isBookmarked ? "fill-amber-400 text-amber-400" : ""
            }`}
          />
          <span className="hidden sm:inline">
            {isBookmarked ? "Marked for Later" : "Review Later"}
          </span>
        </button>
      </div>

      {/* Purpose / Instructions Callout */}
      {question.purpose && (
        <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-2xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-mono uppercase tracking-wider text-brand-accent font-semibold">
                Purpose / Instructions
              </h3>
              <p className="text-xs sm:text-sm text-brand-secondary leading-relaxed whitespace-pre-line">
                {question.purpose}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Callout */}
      {question.scenario && (
        <div className="bg-brand-surface/80 border border-brand-text/15 rounded-2xl p-4 sm:p-5">
          <h3 className="text-xs font-mono uppercase tracking-wider text-brand-secondary font-semibold mb-1.5">
            Scenario
          </h3>
          <p className="text-sm text-brand-text leading-relaxed whitespace-pre-line">
            {question.scenario}
          </p>
        </div>
      )}

      {/* Question Text */}
      <div className="bg-brand-surface/50 border border-brand-text/10 rounded-2xl p-4 sm:p-5 text-brand-text text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
        {question.questionText}
      </div>

      {/* Trace Snippet — its own code block, separate from the Functions Definition below */}
      {question.traceCode && (
        <div className="rounded-2xl border border-brand-text/20 overflow-hidden shadow-inner">
          <CodeBlock code={question.traceCode} language={question.codeLanguage} />
        </div>
      )}

      {/* Supporting Information (Tabs) */}
      {question.supportingTabs && question.supportingTabs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-brand-secondary font-semibold">
            Supporting Information
          </h3>

          <div className="border border-brand-text/15 rounded-2xl overflow-hidden bg-brand-surface/40">
            {/* Tab Headers */}
            <div className="flex items-center border-b border-brand-text/15 bg-brand-surface/80 px-2 pt-2 gap-1 overflow-x-auto">
              {question.supportingTabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      soundManager.playButtonClick();
                      setActiveTabId(tab.id);
                    }}
                    className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-t-xl transition-all cursor-pointer select-none whitespace-nowrap ${
                      isActive
                        ? "bg-brand-surface text-brand-accent shadow-sm"
                        : "text-brand-secondary hover:text-brand-text hover:bg-brand-surface/50"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {activeTab?.isCode ? (
              <CodeBlock code={activeTab.content} showHeader={false} />
            ) : (
              <div className="p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-brand-secondary whitespace-pre-wrap font-mono bg-brand-bg/60">
                {activeTab?.content}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Read-Only Code Block */}
      {question.codeBlock && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-secondary font-semibold">
            <Code2 className="w-4 h-4 text-brand-accent" />
            <span>Function / Code Information</span>
          </div>
          <div className="rounded-2xl border border-brand-text/20 overflow-hidden shadow-inner">
            <CodeBlock code={question.codeBlock} language={question.codeLanguage} />
          </div>
        </div>
      )}

      {/* Answer Area */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-brand-accent font-semibold">
            Your Answer
          </h3>
        </div>

        {/* Input Switch based on question.type */}
        <div>
          {question.type === "short-text" && (
            <ShortTextInput
              id={`question-${question.id}-input`}
              value={answer}
              onChange={onAnswerChange}
              wordLimit={question.wordLimit}
              placeholder={question.placeholder}
            />
          )}

          {question.type === "long-text" && (
            <LongTextInput
              id={`question-${question.id}-input`}
              value={answer}
              onChange={onAnswerChange}
              wordLimit={question.wordLimit}
              placeholder={question.placeholder}
              rows={5}
            />
          )}

          {question.type === "multiple-choice" && (
            <MultipleChoiceInput
              id={`question-${question.id}-input`}
              value={answer}
              onChange={onAnswerChange}
              options={question.options || []}
            />
          )}

          {question.type === "checkbox-group" && (
            <CheckboxGroupInput
              id={`question-${question.id}-input`}
              value={answer}
              onChange={onAnswerChange}
              options={question.options || []}
              maxSelections={question.maxSelections || 3}
            />
          )}

          {question.type === "radio-with-text" && (
            <RadioWithTextInput
              id={`question-${question.id}-input`}
              selectedRadio={radioValue || answer}
              textValue={textValue}
              onRadioChange={(val) => {
                onRadioValueChange?.(val);
                onAnswerChange(val);
              }}
              onTextChange={(val) => onTextValueChange?.(val)}
              options={question.options || []}
              conditionalTextOnValue={question.conditionalTextOnValue}
              conditionalTextFieldLabel={question.conditionalTextFieldLabel}
              conditionalWordLimit={question.conditionalWordLimit}
              placeholder={question.placeholder}
            />
          )}

          {question.type === "number" && (
            <div className="space-y-2">
              <NumberInput
                id={`question-${question.id}-input`}
                value={answer}
                onChange={onAnswerChange}
                prefix={question.numberPrefix}
                suffix={question.numberSuffix}
                placeholder={question.placeholder}
                disabled={disabled}
              />
              {disabled && disabledNote && (
                <p className="text-xs text-brand-accent/80 font-medium">{disabledNote}</p>
              )}
            </div>
          )}

          {question.type === "code" && (
            <CodeInput
              id={`question-${question.id}-input`}
              value={answer || question.prefillValue || ""}
              onChange={onAnswerChange}
              originalValue={question.prefillValue}
              language={question.codeLanguage || "Pseudocode"}
            />
          )}
        </div>
      </div>
    </div>
  );
}
