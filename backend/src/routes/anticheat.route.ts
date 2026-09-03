import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireArbiter } from "../middleware/arbiter.middleware.js";
import {
  appealCase,
  getCasePacket,
  listCases,
  resolveCase,
} from "../anticheat/anticheat.controller.js";

export const anticheatRouter = Router();

anticheatRouter.get("/admin/cases", requireAuth, requireArbiter, listCases);
anticheatRouter.get("/admin/cases/:caseId", requireAuth, requireArbiter, getCasePacket);
anticheatRouter.post("/admin/cases/:caseId/resolve", requireAuth, requireArbiter, resolveCase);

// Not an arbiter route: the suspect appeals their own case.
anticheatRouter.post("/cases/:caseId/appeal", requireAuth, appealCase);
