import { Router } from "express";
import { env } from "../core/config/env.js";
import { requireAuth } from "../core/middleware/auth.middleware.js";
import { GamesController } from "../controllers/games.controller.js";

export const gamesRouter = Router();

// Flag-guard: returns 503 Service Unavailable if MULTIPLAYER_ENABLED is false — mirrors matchmakingRouter.
gamesRouter.use((_req, res, next) => {
  if (!env.MULTIPLAYER_ENABLED) {
    res.status(503).json({ error: "Multiplayer features are currently disabled." });
    return;
  }
  next();
});

// Specific routes before the "/:id" catch-all.
gamesRouter.get("/history/me", requireAuth, GamesController.getHistory);
gamesRouter.get("/leaderboard/:variantId", GamesController.getLeaderboard);
gamesRouter.get("/:id", GamesController.getById);
