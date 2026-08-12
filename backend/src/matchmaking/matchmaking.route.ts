import { Router } from "express";
import { env } from "../config/env.js";
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

matchmakingRouter.post("/queue", enqueueTicket);
matchmakingRouter.delete("/queue/:ticketId", cancelTicket);
matchmakingRouter.get("/queue/:ticketId", getTicketStatus);
