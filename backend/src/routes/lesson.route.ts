import { Router } from "express";
import { LessonController } from "../controllers/lesson.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", LessonController.getCourses);
router.get("/:slug", LessonController.getLesson);

// Protected routes
router.post("/:lessonId/progress", requireAuth, LessonController.updateProgress);
router.post("/:lessonId/complete", requireAuth, LessonController.completeLesson);
router.post("/:lessonId/validate-move", requireAuth, LessonController.validateMove);

export { router as lessonRouter };
