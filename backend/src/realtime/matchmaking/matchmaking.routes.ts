import { Router, Request, Response, NextFunction } from "express";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { enqueueTicket, cancelTicket, getTicketStatus } from "./matchmaking.controller.js";

export const matchmakingRouter = Router();

// Flag-guard: returns 503 Service Unavailable if MULTIPLAYER_ENABLED is false
matchmakingRouter.use((_req, res, next) => {
  if (!env.MULTIPLAYER_ENABLED) {
    res.status(503).json({ error: "Multiplayer features are currently disabled." });
    return;
  }
  next();
});

// requireAuth mirrors games.route.ts — without it, req.user is never populated and every
// caller (regardless of who is actually signed in) collapses into the same anonymous ticket.
matchmakingRouter.post("/queue", requireAuth, enqueueTicket);
matchmakingRouter.delete("/queue/:ticketId", requireAuth, cancelTicket);
matchmakingRouter.get("/queue/:ticketId", requireAuth, getTicketStatus);
