import type { GradingRules, AttemptAnswers } from "../types/assessment.js";

export interface GradingInput {
  gradingRules: GradingRules | null | undefined;
  answers: AttemptAnswers;
  radioValues: AttemptAnswers;
}

export interface GradingOutcome {
  /** PASS/FAIL only make sense when gradingRules is present; otherwise REVIEW. */
  result: "PASS" | "FAIL" | "REVIEW";
  wrongCount: number | null;
}

function normalize(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/**
 * Grades an attempt's objective questions against a template's grading rules.
 *
 * - No `gradingRules` (e.g. Manager track) → always REVIEW, no wrong count.
 * - `gradingRules` present → count how many rules are "wrong", fail if it
 *   exceeds `maxWrongAllowed`. A candidate who passes still only reaches
 *   PASS (== "progressed to manual review"), never an automatic hire.
 */
export function gradeAttempt({
  gradingRules,
  answers,
  radioValues,
}: GradingInput): GradingOutcome {
  if (!gradingRules) {
    return { result: "REVIEW", wrongCount: null };
  }

  let wrongCount = 0;

  for (const rule of gradingRules.rules) {
    const raw =
      rule.field === "radioValue" ? radioValues[rule.questionId] : answers[rule.questionId];

    let isWrong: boolean;
    switch (rule.type) {
      case "wrongIfNotEqual":
        isWrong = normalize(raw) !== normalize(rule.value);
        break;
      case "wrongIfEquals":
        isWrong = normalize(raw) === normalize(rule.value);
        break;
      case "wrongIfGreaterThan": {
        const numeric = Number(raw);
        isWrong =
          !Number.isFinite(numeric) || numeric > (rule.threshold ?? Number.POSITIVE_INFINITY);
        break;
      }
      case "wrongIfNotSubsetOf": {
        const allowed = new Set((rule.values ?? []).map((v) => normalize(v)));
        const selected = (raw ?? "")
          .split(",")
          .map((v) => normalize(v))
          .filter((v) => v !== "");
        isWrong = selected.length === 0 || selected.some((v) => !allowed.has(v));
        break;
      }
      default:
        isWrong = false;
    }

    if (isWrong) wrongCount += 1;
  }

  const result = wrongCount > gradingRules.maxWrongAllowed ? "FAIL" : "PASS";
  return { result, wrongCount };
}
