import { Router } from "express";
import { PathwayProgressController } from "../controllers/pathway-progress.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const pathwayProgressRouter = Router();

// GET /api/pathway-progress — fetch authenticated user's progress
pathwayProgressRouter.get("/", requireAuth, PathwayProgressController.get);

// PUT /api/pathway-progress — save/upsert authenticated user's progress
pathwayProgressRouter.put("/", requireAuth, PathwayProgressController.upsert);
