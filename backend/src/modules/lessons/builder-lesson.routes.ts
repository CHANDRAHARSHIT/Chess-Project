import { Router } from "express";
import { requireAuth } from "../../core/middleware/auth.middleware.js";
import {
  getLessons,
  createLesson,
  getLessonById,
  updateLesson,
  deleteLesson,
  createSegment,
  updateSegment,
  deleteSegment,
  createSlide,
  updateSlide,
  deleteSlide,
} from "./builder-lesson.controller.js";

const builderLessonRouter = Router();

// Protect all lesson builder endpoints with auth middleware
builderLessonRouter.use(requireAuth);

builderLessonRouter.get("/", getLessons);
builderLessonRouter.post("/", createLesson);
builderLessonRouter.get("/:id", getLessonById);
builderLessonRouter.put("/:id", updateLesson);
builderLessonRouter.delete("/:id", deleteLesson);

// Segment routes
builderLessonRouter.post("/:id/segments", createSegment);
builderLessonRouter.put("/:id/segments/:segmentId", updateSegment);
builderLessonRouter.delete("/:id/segments/:segmentId", deleteSegment);

// Slide routes
builderLessonRouter.post("/:id/segments/:segmentId/slides", createSlide);
builderLessonRouter.put("/:id/slides/:slideId", updateSlide);
builderLessonRouter.delete("/:id/slides/:slideId", deleteSlide);

export { builderLessonRouter };
