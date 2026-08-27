/**
 * Shared shapes for the Join Us candidate assessment feature.
 *
 * `AssessmentConfig` mirrors the frontend's
 * `frontend/src/features/join-us/assessment/assessmentTypes.ts` exactly —
 * an `AssessmentTemplate.data` row is served to the client as-is and
 * rendered by the existing QuestionCard/TimedCodingScreen components.
 */

export type QuestionType =
  | "short-text"
  | "long-text"
  | "multiple-choice"
  | "checkbox-group"
  | "radio-with-text"
  | "number"
  | "code";

export interface SupportingInfoTab {
  id: string;
  label: string;
  content: string;
  /** Renders content as a line-numbered code block instead of prose. */
  isCode?: boolean;
}

export interface AssessmentQuestion {
  id: string;
  questionNumber: number;
  type: QuestionType;
  title?: string;
  questionText: string;
  purpose?: string;
  scenario?: string;
  supportingTabs?: SupportingInfoTab[];
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
  /** Whether AI/search/external assistance is allowed for this question (default: false). */
  assistanceAllowed?: boolean;
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
  estimateQuestionId: string;
  maxEstimateMinutes: number;
  bonusMinutes: number;
  question: AssessmentQuestion;
}

export interface AssessmentConfig {
  id: string;
  roleIdPrefix: string;
  roleTitle: string;
  totalTimeMinutes: number;
  totalQuestions: number;
  pages: AssessmentPageConfig[];
  timedCodingConfig?: TimedCodingConfig;
}

/**
 * Grading rules for a template's objective (auto-graded) questions.
 * Absent/null `gradingRules` means the track is manual-review-only
 * (e.g. Manager track — every submission simply goes to REVIEW).
 */
export type GradingRuleType =
  | "wrongIfNotEqual"
  | "wrongIfEquals"
  | "wrongIfGreaterThan"
  | "wrongIfNotSubsetOf";

export type GradingField = "answer" | "radioValue";

export interface GradingRule {
  questionId: string;
  field: GradingField;
  type: GradingRuleType;
  /** Case-insensitive, trimmed comparison value for wrongIfNotEqual / wrongIfEquals. */
  value?: string;
  /**
   * Allowed option values for wrongIfNotSubsetOf (e.g. a checkbox-group answer
   * like "A,B,D" is wrong unless every selected option appears in this list).
   */
  values?: string[];
  /** Numeric threshold for wrongIfGreaterThan. */
  threshold?: number;
}

export interface GradingRules {
  maxWrongAllowed: number;
  rules: GradingRule[];
}

export interface AttemptAnswers {
  [questionId: string]: string;
}
