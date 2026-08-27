import type { Request, Response, NextFunction } from "express";
import { AssessmentService, HttpError } from "../services/assessment.service.js";

function handleServiceError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({ status: "fail", message: error.message });
  }
  next(error);
}

/** Shapes an AssessmentAttempt row for the client (Json fields are already plain objects). */
function serializeAttempt(attempt: {
  id: string;
  trackSlug: string;
  status: string;
  result: string;
  answers: unknown;
  radioValues: unknown;
  textValues: unknown;
  bookmarks: number[];
  estimateMinutes: number | null;
  timedSectionStartedAt: Date | null;
  timedDeadlineAt: Date | null;
  extensionUsed: boolean;
  wrongCount: number | null;
  submittedAt: Date | null;
}) {
  return {
    id: attempt.id,
    trackSlug: attempt.trackSlug,
    status: attempt.status,
    result: attempt.result,
    answers: attempt.answers,
    radioValues: attempt.radioValues,
    textValues: attempt.textValues,
    bookmarks: attempt.bookmarks,
    estimateMinutes: attempt.estimateMinutes,
    timedSectionStartedAt: attempt.timedSectionStartedAt,
    timedDeadlineAt: attempt.timedDeadlineAt,
    extensionUsed: attempt.extensionUsed,
    wrongCount: attempt.wrongCount,
    submittedAt: attempt.submittedAt,
  };
}

export class AssessmentController {
  /**
   * GET /api/assessments/:trackSlug
   * Returns the track's active question template plus the authenticated
   * user's attempt (created on first visit).
   */
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as string;
      const { trackSlug } = req.params;
      const attempt = await AssessmentService.getOrCreateAttempt(userId, trackSlug);
      res.status(200).json({
        status: "success",
        data: {
          template: attempt.template.data,
          attempt: serializeAttempt(attempt),
        },
      });
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }

  /**
   * PUT /api/assessments/:trackSlug/answer
   * Body: { questionId: string, value: string, radioValue?: string, textValue?: string }
   */
  static async saveAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as string;
      const { trackSlug } = req.params;
      const { questionId, value, radioValue, textValue } = req.body;

      if (typeof questionId !== "string" || typeof value !== "string") {
        return res
          .status(400)
          .json({ status: "fail", message: "questionId and value must be strings." });
      }

      const attempt = await AssessmentService.saveAnswer(
        userId,
        trackSlug,
        questionId,
        value,
        typeof radioValue === "string" ? radioValue : undefined,
        typeof textValue === "string" ? textValue : undefined
      );
      res.status(200).json({ status: "success", data: serializeAttempt(attempt) });
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }

  /**
   * PUT /api/assessments/:trackSlug/bookmark
   * Body: { questionNumber: number, bookmarked: boolean }
   */
  static async setBookmark(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as string;
      const { trackSlug } = req.params;
      const { questionNumber, bookmarked } = req.body;

      if (typeof questionNumber !== "number" || typeof bookmarked !== "boolean") {
        return res.status(400).json({
          status: "fail",
          message: "questionNumber must be a number and bookmarked a boolean.",
        });
      }

      const attempt = await AssessmentService.setBookmark(
        userId,
        trackSlug,
        questionNumber,
        bookmarked
      );
      res.status(200).json({ status: "success", data: serializeAttempt(attempt) });
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }

  /**
   * PUT /api/assessments/:trackSlug/estimate
   * Body: { estimateMinutes: number }
   */
  static async submitEstimate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as string;
      const { trackSlug } = req.params;
      const { estimateMinutes } = req.body;

      if (typeof estimateMinutes !== "number") {
        return res
          .status(400)
          .json({ status: "fail", message: "estimateMinutes must be a number." });
      }

      const attempt = await AssessmentService.submitEstimate(userId, trackSlug, estimateMinutes);
      res.status(200).json({ status: "success", data: serializeAttempt(attempt) });
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }

  /**
   * POST /api/assessments/:trackSlug/start-timed-section
   * Stamps the timed section's start/deadline the first time the candidate
   * actually opens Q11. No-op if it's already been started.
   */
  static async startTimedSection(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as string;
      const { trackSlug } = req.params;
      const attempt = await AssessmentService.startTimedSection(userId, trackSlug);
      res.status(200).json({ status: "success", data: serializeAttempt(attempt) });
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }

  /**
   * POST /api/assessments/:trackSlug/extend-time
   * One-time, 15-minute extension of the timed section deadline.
   */
  static async requestExtension(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as string;
      const { trackSlug } = req.params;
      const attempt = await AssessmentService.requestExtension(userId, trackSlug);
      res.status(200).json({ status: "success", data: serializeAttempt(attempt) });
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }

  /**
   * POST /api/assessments/:trackSlug/submit
   * Finalizes the attempt and returns the graded (or manual-review) result.
   */
  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as string;
      const { trackSlug } = req.params;
      const attempt = await AssessmentService.submitAttempt(userId, trackSlug);
      res.status(200).json({ status: "success", data: serializeAttempt(attempt) });
    } catch (error) {
      handleServiceError(error, res, next);
    }
  }
}
