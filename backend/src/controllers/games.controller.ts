import type { Request, Response, NextFunction } from "express";
import { GamesService } from "../services/games.service.js";
import { env } from "../config/env.js";
import { analyseGameAsText, GameNotAnalysableError } from "../anticheat/index.js";

export class GamesController {
  /**
   * Returns the authenticated user's own game history.
   * GET /api/games/history/me
   */
  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          status: "fail",
          message: "Unauthorized. Please sign in.",
        });
      }

      const limit = Number(req.query.limit) || undefined;
      const history = await GamesService.getGameHistory(userId, limit);

      res.status(200).json({
        status: "success",
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Returns a single finished game record by its database ID.
   * GET /api/games/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== "string" || id.trim() === "") {
        return res.status(400).json({
          status: "fail",
          message: "A valid game ID must be provided.",
        });
      }

      const game = await GamesService.getGameById(id);

      if (!game) {
        return res.status(404).json({
          status: "fail",
          message: `Game with ID '${id}' not found.`,
        });
      }

      res.status(200).json({
        status: "success",
        data: { game },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Returns the post-game blunder analysis for a finished game as plain text.
   * GET /api/games/:id/analysis
   *
   * Restricted to the game's own participants: the report names every mistake a
   * player made, so exposing it publicly would hand anyone a scouting tool.
   */
  static async getAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      if (!env.ANTICHEAT_ENABLED) {
        return res.status(503).json({
          status: "fail",
          message: "Post-game analysis is currently disabled.",
        });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "fail", message: "Unauthorized. Please sign in." });
      }

      const { id } = req.params;
      if (!id || typeof id !== "string" || id.trim() === "") {
        return res.status(400).json({
          status: "fail",
          message: "A valid game ID must be provided.",
        });
      }

      const game = await GamesService.getGameById(id);
      if (!game) {
        return res.status(404).json({
          status: "fail",
          message: `Game with ID '${id}' not found.`,
        });
      }

      if (!game.participants.some((p) => p.userId === userId)) {
        return res.status(403).json({
          status: "fail",
          message: "You can only view analysis for games you played in.",
        });
      }

      const report = await analyseGameAsText(id);
      res.type("text/plain").status(200).send(report);
    } catch (error) {
      if (error instanceof GameNotAnalysableError) {
        return res.status(422).json({ status: "fail", message: error.message });
      }
      next(error);
    }
  }

  /**
   * Returns the top-rated players for a variant.
   * GET /api/games/leaderboard/:variantId
   */
  static async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { variantId } = req.params;

      if (!variantId || typeof variantId !== "string" || variantId.trim() === "") {
        return res.status(400).json({
          status: "fail",
          message: "A valid variant ID must be provided.",
        });
      }

      const limit = Number(req.query.limit) || undefined;
      const leaderboard = await GamesService.getLeaderboard(variantId, limit);

      res.status(200).json({
        status: "success",
        data: { leaderboard },
      });
    } catch (error) {
      next(error);
    }
  }
}
