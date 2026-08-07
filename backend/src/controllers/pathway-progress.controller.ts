import type { Request, Response, NextFunction } from "express";
import { PathwayProgressService } from "../services/pathway-progress.service.js";

export class PathwayProgressController {
  /**
   * GET /api/pathway-progress
   * Returns the authenticated user's pathway puzzle progress.
   */
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as string;
      const progress = await PathwayProgressService.getProgress(userId);
      res.status(200).json({ status: "success", data: progress });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/pathway-progress
   * Saves (upserts) the authenticated user's pathway puzzle progress.
   *
   * Body:
   *   { completedIds: string[], streak: number, totalSolved: number }
   */
  static async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as string;
      const { completedIds, streak, totalSolved } = req.body;

      // Validate payload
      if (!Array.isArray(completedIds)) {
        return res.status(400).json({
          status: "fail",
          message: "completedIds must be an array of strings.",
        });
      }
      if (typeof streak !== "number" || typeof totalSolved !== "number") {
        return res.status(400).json({
          status: "fail",
          message: "streak and totalSolved must be numbers.",
        });
      }

      const progress = await PathwayProgressService.upsertProgress(userId, {
        completedIds,
        streak: Math.max(0, Math.floor(streak)),
        totalSolved: Math.max(0, Math.floor(totalSolved)),
      });

      res.status(200).json({ status: "success", data: progress });
    } catch (error) {
      next(error);
    }
  }
}
