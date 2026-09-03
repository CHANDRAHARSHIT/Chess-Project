import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import {
  appealCase,
  getCase,
  listCases,
  resolveCase,
} from "../anticheat/anticheat.controller.js";

export const anticheatRouter = Router();

anticheatRouter.get("/admin/cases", requireAuth, requireAdmin, listCases);
anticheatRouter.get("/admin/cases/:caseId", requireAuth, requireAdmin, getCase);
anticheatRouter.post("/admin/cases/:caseId/resolve", requireAuth, requireAdmin, resolveCase);

// Not an admin route: the suspect appeals their own case.
anticheatRouter.post("/cases/:caseId/appeal", requireAuth, appealCase);
