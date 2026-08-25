import { useState } from 'react';
import { Bookmark, Info, Code2 } from 'lucide-react';
import { soundManager } from '@/shared/lib/SoundManager';
import type { AssessmentQuestion } from '../assessmentTypes';
import ShortTextInput from './inputs/ShortTextInput';
import LongTextInput from './inputs/LongTextInput';
import MultipleChoiceInput from './inputs/MultipleChoiceInput';
import CheckboxGroupInput from './inputs/CheckboxGroupInput';
import RadioWithTextInput from './inputs/RadioWithTextInput';
import NumberInput from './inputs/NumberInput';
import CodeInput from './inputs/CodeInput';

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
}

export default function QuestionCard({
  question,
  totalQuestions,
  answer,
  onAnswerChange,
  isBookmarked,
  onToggleBookmark,
  radioValue = '',
  textValue = '',
  onRadioValueChange,
  onTextValueChange,
}: QuestionCardProps) {
  const [activeTabId, setActiveTabId] = useState<string>(
    question.supportingTabs?.[0]?.id || ''
  );

  const activeTab = question.supportingTabs?.find(
    (tab) => tab.id === activeTabId
  );

  return (
    <div
      id={`question-${question.questionNumber}`}
      className="bg-brand-surface rounded-3xl border border-brand-text/15 p-6 sm:p-8 space-y-6 relative overflow-hidden backdrop-blur-sm scroll-mt-28"
    >
      {/* Question Header */}
      <div className="flex items-center justify-between pb-4 border-b border-brand-text/10">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-brand-accent font-semibold">
            Question {question.questionNumber} of {totalQuestions}
          </span>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-text mt-0.5">
            Question {question.questionNumber}
          </h2>
        </div>

        {/* Bookmark button */}
        <button
          type="button"
          onClick={() => {
            soundManager.playButtonClick();
            onToggleBookmark();
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all duration-200 cursor-pointer ${
            isBookmarked
              ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
              : 'bg-brand-surface border-brand-text/15 text-brand-secondary hover:text-brand-text hover:border-brand-text/30'
          }`}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark question for later'}
        >
          <Bookmark
            className={`w-4 h-4 ${
              isBookmarked ? 'fill-amber-400 text-amber-400' : ''
            }`}
          />
          <span className="hidden sm:inline">
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
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
      <div className="space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-brand-secondary font-semibold">
          Question
        </h3>
        <div className="bg-brand-surface/50 border border-brand-text/10 rounded-2xl p-4 sm:p-5 text-brand-text text-sm sm:text-base leading-relaxed whitespace-pre-line font-sans">
          {question.questionText}
        </div>
      </div>

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
                        ? 'bg-brand-surface text-brand-accent shadow-sm'
                        : 'text-brand-secondary hover:text-brand-text hover:bg-brand-surface/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-brand-secondary whitespace-pre-line font-mono bg-brand-bg/60">
              {activeTab?.content}
            </div>
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
          <div className="rounded-2xl border border-brand-text/20 bg-brand-bg p-4 font-mono text-xs sm:text-sm text-brand-text whitespace-pre overflow-x-auto leading-relaxed shadow-inner">
            {question.codeBlock}
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
          {question.type === 'short-text' && (
            <ShortTextInput
              id={`question-${question.id}-input`}
              value={answer}
              onChange={onAnswerChange}
              wordLimit={question.wordLimit}
              placeholder={question.placeholder}
            />
          )}

          {question.type === 'long-text' && (
            <LongTextInput
              id={`question-${question.id}-input`}
              value={answer}
              onChange={onAnswerChange}
              wordLimit={question.wordLimit}
              placeholder={question.placeholder}
              rows={5}
            />
          )}

          {question.type === 'multiple-choice' && (
            <MultipleChoiceInput
              id={`question-${question.id}-input`}
              value={answer}
              onChange={onAnswerChange}
              options={question.options || []}
            />
          )}

          {question.type === 'checkbox-group' && (
            <CheckboxGroupInput
              id={`question-${question.id}-input`}
              value={answer}
              onChange={onAnswerChange}
              options={question.options || []}
              maxSelections={question.maxSelections || 3}
            />
          )}

          {question.type === 'radio-with-text' && (
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

          {question.type === 'number' && (
            <NumberInput
              id={`question-${question.id}-input`}
              value={answer}
              onChange={onAnswerChange}
              prefix={question.numberPrefix}
              suffix={question.numberSuffix}
              placeholder={question.placeholder}
            />
          )}

          {question.type === 'code' && (
            <CodeInput
              id={`question-${question.id}-input`}
              value={answer || question.prefillValue || ''}
              onChange={onAnswerChange}
              originalValue={question.prefillValue}
              language={question.codeLanguage || 'Pseudocode'}
            />
          )}
        </div>
      </div>
    </div>
  );
}
