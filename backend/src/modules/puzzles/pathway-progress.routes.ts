import { Router } from "express";
import { PathwayProgressController } from "./pathway-progress.controller.js";
import { requireAuth } from "../../core/middleware/auth.middleware.js";

export const pathwayProgressRouter = Router();

// GET /api/pathway-progress — fetch authenticated user's progress
pathwayProgressRouter.get("/", requireAuth, PathwayProgressController.get);

// PUT /api/pathway-progress — save/upsert authenticated user's progress
pathwayProgressRouter.put("/", requireAuth, PathwayProgressController.upsert);
