import { Router } from "express";
import { OpponentController } from "../controllers/opponent.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Ingest games for an opponent
router.post("/ingest", requireAuth, OpponentController.ingestGames);

// Retrieve games for an opponent
router.get("/:username", requireAuth, OpponentController.getGames);
// Retrieve scouting report for an opponent
router.get("/:username/report", requireAuth, OpponentController.getReport);

export { router as opponentRouter };
