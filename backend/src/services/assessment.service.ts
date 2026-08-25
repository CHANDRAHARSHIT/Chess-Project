import { prisma } from "../config/prisma.js";
import { gradeAttempt } from "../utils/assessmentGrading.js";
import type {
  AssessmentConfig,
  AttemptAnswers,
  GradingRules,
} from "../types/assessment.js";

/** Fallback extension length if a template's timedCodingConfig is somehow missing bonusMinutes. */
const DEFAULT_EXTENSION_MINUTES = 15;

/**
 * If a candidate hasn't touched an in-progress attempt (no page load, no
 * answer save) for this long, we assume they abandoned it and wipe it back
 * to a blank slate on the next visit — same row, still IN_PROGRESS, never
 * submitted. This is what gives every candidate a fair, single real attempt:
 * idle time doesn't count against them, but it also can't be used to "peek"
 * at questions across multiple sittings and slowly assemble answers.
 */
const IDLE_RESET_MS = 2 * 60 * 60 * 1000;

export class HttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

function wordCount(value: string): number {
  const trimmed = value.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

/** Finds a question's wordLimit (if any) by id, across regular pages and the timed challenge. */
function findWordLimit(config: AssessmentConfig, questionId: string): number | undefined {
  for (const page of config.pages) {
    const q = page.questions.find((q) => q.id === questionId);
    if (q) return q.wordLimit;
  }
  if (config.timedCodingConfig?.question.id === questionId) {
    return config.timedCodingConfig.question.wordLimit;
  }
  return undefined;
}

export class AssessmentService {
  /**
   * Fetches (or creates) the authenticated user's attempt for a track,
   * lazily auto-submitting it first if its timed section deadline has
   * already passed (see submitEstimate/requestExtension for how that
   * deadline gets set).
   */
  static async getOrCreateAttempt(userId: string, trackSlug: string) {
    const existing = await prisma.assessmentAttempt.findUnique({
      where: { userId_trackSlug: { userId, trackSlug } },
      include: { template: true },
    });

    if (existing) {
      const afterTimedExpiry = await AssessmentService.autoExpireIfNeeded(existing);
      return AssessmentService.autoResetIfStale(afterTimedExpiry);
    }

    const template = await prisma.assessmentTemplate.findFirst({
      where: { trackSlug, isActive: true },
      orderBy: { version: "desc" },
    });

    if (!template) {
      throw new HttpError(404, `No active assessment template for track "${trackSlug}".`);
    }

    const created = await prisma.assessmentAttempt.create({
      data: { userId, trackSlug, templateId: template.id },
      include: { template: true },
    });

    return created;
  }

  /** Auto-submits an in-progress attempt if its timed deadline has already passed. */
  private static async autoExpireIfNeeded<
    T extends {
      id: string;
      status: string;
      timedDeadlineAt: Date | null;
    },
  >(attempt: T & { template: { data: unknown; gradingRules: unknown } }) {
    if (attempt.status !== "IN_PROGRESS" || !attempt.timedDeadlineAt) {
      return attempt;
    }
    if (attempt.timedDeadlineAt.getTime() > Date.now()) {
      return attempt;
    }
    return AssessmentService.finalizeSubmit(attempt.id);
  }

  /**
   * Resets an in-progress attempt back to blank if it's gone untouched for
   * longer than IDLE_RESET_MS, otherwise just refreshes its access clock.
   * Only ever mutates the existing row — never creates a second attempt, so
   * the one-real-submission-per-track rule stays intact.
   */
  private static async autoResetIfStale<
    T extends { id: string; status: string; lastAccessedAt: Date },
  >(attempt: T & { template: { data: unknown; gradingRules: unknown } }) {
    if (attempt.status !== "IN_PROGRESS") {
      return attempt;
    }

    const idleMs = Date.now() - attempt.lastAccessedAt.getTime();
    if (idleMs < IDLE_RESET_MS) {
      return prisma.assessmentAttempt.update({
        where: { id: attempt.id },
        data: { lastAccessedAt: new Date() },
        include: { template: true },
      });
    }

    return prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        answers: {},
        radioValues: {},
        textValues: {},
        bookmarks: [],
        estimateMinutes: null,
        timedSectionStartedAt: null,
        timedDeadlineAt: null,
        extensionUsed: false,
        wrongCount: null,
        lastAccessedAt: new Date(),
      },
      include: { template: true },
    });
  }

  private static assertInProgress(attempt: { status: string }) {
    if (attempt.status !== "IN_PROGRESS") {
      throw new HttpError(409, "This assessment has already been submitted.");
    }
  }

  static async saveAnswer(
    userId: string,
    trackSlug: string,
    questionId: string,
    value: string,
    radioValue?: string,
    textValue?: string
  ) {
    const attempt = await AssessmentService.getOrCreateAttempt(userId, trackSlug);
    AssessmentService.assertInProgress(attempt);

    const config = attempt.template.data as unknown as AssessmentConfig;
    const wordLimit = findWordLimit(config, questionId);
    if (wordLimit && wordCount(value) > wordLimit) {
      throw new HttpError(400, `Answer exceeds the ${wordLimit}-word limit for this question.`);
    }

    const answers = { ...(attempt.answers as AttemptAnswers), [questionId]: value };
    const radioValues = { ...(attempt.radioValues as AttemptAnswers) };
    const textValues = { ...(attempt.textValues as AttemptAnswers) };
    if (radioValue !== undefined) radioValues[questionId] = radioValue;
    if (textValue !== undefined) textValues[questionId] = textValue;

    return prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: { answers, radioValues, textValues },
      include: { template: true },
    });
  }

  static async setBookmark(
    userId: string,
    trackSlug: string,
    questionNumber: number,
    bookmarked: boolean
  ) {
    const attempt = await AssessmentService.getOrCreateAttempt(userId, trackSlug);
    AssessmentService.assertInProgress(attempt);

    const next = new Set(attempt.bookmarks);
    if (bookmarked) next.add(questionNumber);
    else next.delete(questionNumber);

    return prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: { bookmarks: Array.from(next) },
      include: { template: true },
    });
  }

  /**
   * Records the candidate's Q10 time estimate and — if it's within the
   * template's limit — starts the timed section: timedSectionStartedAt is
   * stamped now, and timedDeadlineAt = now + (estimate + bonusMinutes).
   * Both are absolute timestamps; remaining time is always derived as
   * `deadline - now()`, never stored as a countdown value.
   */
  static async submitEstimate(userId: string, trackSlug: string, estimateMinutes: number) {
    const attempt = await AssessmentService.getOrCreateAttempt(userId, trackSlug);
    AssessmentService.assertInProgress(attempt);

    const config = attempt.template.data as unknown as AssessmentConfig;
    const timedConfig = config.timedCodingConfig;
    if (!timedConfig) {
      throw new HttpError(400, "This track has no timed section.");
    }
    if (!Number.isFinite(estimateMinutes) || estimateMinutes < 0) {
      throw new HttpError(400, "estimateMinutes must be a non-negative number.");
    }

    const answers = {
      ...(attempt.answers as AttemptAnswers),
      [timedConfig.estimateQuestionId]: String(estimateMinutes),
    };

    // The deadline is exactly the candidate's own estimate — no automatic
    // bonus. Extra time is only ever granted via the one-time extension
    // (requestExtension), which the candidate has to explicitly ask for.
    const exceedsLimit = estimateMinutes > timedConfig.maxEstimateMinutes;
    const startedAt = new Date();
    const deadline = exceedsLimit
      ? null
      : new Date(startedAt.getTime() + estimateMinutes * 60_000);

    return prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        answers,
        estimateMinutes,
        timedSectionStartedAt: exceedsLimit ? null : startedAt,
        timedDeadlineAt: deadline,
      },
      include: { template: true },
    });
  }

  /** One-time extension of the timed section deadline, by the template's bonusMinutes. */
  static async requestExtension(userId: string, trackSlug: string) {
    const attempt = await AssessmentService.getOrCreateAttempt(userId, trackSlug);
    AssessmentService.assertInProgress(attempt);

    if (!attempt.timedDeadlineAt) {
      throw new HttpError(400, "The timed section hasn't started yet.");
    }
    if (attempt.extensionUsed) {
      throw new HttpError(409, "You've already used your one-time extension.");
    }

    const config = attempt.template.data as unknown as AssessmentConfig;
    const extensionMinutes = config.timedCodingConfig?.bonusMinutes ?? DEFAULT_EXTENSION_MINUTES;
    const newDeadline = new Date(attempt.timedDeadlineAt.getTime() + extensionMinutes * 60_000);

    return prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: { timedDeadlineAt: newDeadline, extensionUsed: true },
      include: { template: true },
    });
  }

  static async submitAttempt(userId: string, trackSlug: string) {
    const attempt = await AssessmentService.getOrCreateAttempt(userId, trackSlug);
    AssessmentService.assertInProgress(attempt);
    return AssessmentService.finalizeSubmit(attempt.id);
  }

  /** Shared by both explicit submission and lazy timer-expiry auto-submission. */
  private static async finalizeSubmit(attemptId: string) {
    const attempt = await prisma.assessmentAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      include: { template: true },
    });

    const gradingRules = attempt.template.gradingRules as unknown as GradingRules | null;
    const { result, wrongCount } = gradeAttempt({
      gradingRules,
      answers: attempt.answers as unknown as AttemptAnswers,
      radioValues: attempt.radioValues as unknown as AttemptAnswers,
    });

    return prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        result,
        wrongCount,
      },
      include: { template: true },
    });
  }
}
