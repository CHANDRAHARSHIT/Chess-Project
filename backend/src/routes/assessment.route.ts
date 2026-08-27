import { Router } from "express";
import { AssessmentController } from "../controllers/assessment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const assessmentRouter = Router();

assessmentRouter.get("/:trackSlug", requireAuth, AssessmentController.get);
assessmentRouter.put("/:trackSlug/answer", requireAuth, AssessmentController.saveAnswer);
assessmentRouter.put("/:trackSlug/bookmark", requireAuth, AssessmentController.setBookmark);
assessmentRouter.put("/:trackSlug/estimate", requireAuth, AssessmentController.submitEstimate);
assessmentRouter.post(
  "/:trackSlug/start-timed-section",
  requireAuth,
  AssessmentController.startTimedSection
);
assessmentRouter.post(
  "/:trackSlug/extend-time",
  requireAuth,
  AssessmentController.requestExtension
);
assessmentRouter.post("/:trackSlug/submit", requireAuth, AssessmentController.submit);
