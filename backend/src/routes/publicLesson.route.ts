import { Router } from "express";
import { getPublishedLessons, getPublishedLessonById } from "../controllers/publicLesson.controller.js";

const publicLessonRouter = Router();

// Public routes (no authentication required)
publicLessonRouter.get("/", getPublishedLessons);
publicLessonRouter.get("/:id", getPublishedLessonById);

export { publicLessonRouter };
