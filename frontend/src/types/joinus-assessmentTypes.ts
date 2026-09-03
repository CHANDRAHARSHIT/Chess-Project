export type QuestionType =
  | 'short-text'
  | 'long-text'
  | 'multiple-choice'
  | 'checkbox-group'
  | 'radio-with-text'
  | 'number'
  | 'code';

export interface SupportingInfoTab {
  id: string;
  label: string;
  content: string;
  /** Renders content as a line-numbered code block instead of prose. */
  isCode?: boolean;
}

export interface AssessmentQuestion {
  id: string;
  questionNumber: number; // e.g. 1 (shows Question 1/11 or 1/6)
  type: QuestionType;
  title?: string;
  questionText: string;
  purpose?: string;
  scenario?: string;
  supportingTabs?: SupportingInfoTab[];
  /** A short snippet shown as its own code block directly under the question text (e.g. the call site to trace), separate from `codeBlock`. */
  traceCode?: string;
  codeBlock?: string;
  prefillValue?: string;
  wordLimit?: number;
  charLimit?: number;
  maxSelections?: number;
  options?: { value: string; label: string }[];
  conditionalTextFieldLabel?: string;
  conditionalTextOnValue?: string;
  conditionalWordLimit?: number;
  placeholder?: string;
  numberSuffix?: string;
  numberPrefix?: string;
  codeLanguage?: string;
  tips?: string;
}

export interface AssessmentPageConfig {
  id: string;
  pageNumber: number;
  pageTitle?: string;
  purpose?: string;
  questionIds: string[];
  questions: AssessmentQuestion[];
  submitButtonText?: string;
}

export interface TimedCodingConfig {
  estimateQuestionId: string; // e.g. 'q10'
  maxEstimateMinutes: number; // 90
  bonusMinutes: number; // 15
  question: AssessmentQuestion;
}

export interface AssessmentConfig {
  id: string;
  roleIdPrefix: string; // e.g. 'backend' to match all backend-* roles
  roleTitle: string;
  totalTimeMinutes: number; // e.g. 120 (2 hours)
  totalQuestions: number;
  pages: AssessmentPageConfig[];
  timedCodingConfig?: TimedCodingConfig;
}
