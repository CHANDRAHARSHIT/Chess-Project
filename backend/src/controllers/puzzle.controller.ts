import type { Request, Response, NextFunction } from "express";
import { PuzzleService } from "../services/puzzle.service.js";

export class PuzzleController {
  /**
   * GET /api/puzzles/themes
   * Returns a sorted list of all unique theme tags in the puzzle database.
   */
  static async getThemes(_req: Request, res: Response, next: NextFunction) {
    try {
      const themes = await PuzzleService.getThemes();
      res.status(200).json({
        status: "success",
        data: { themes },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/puzzles
   * Query params:
   *   - themes    : comma-separated theme tags (e.g. "mateIn1,endgame")
   *   - minRating : minimum puzzle rating (default 0)
   *   - maxRating : maximum puzzle rating (default 3000)
   *   - limit     : max puzzles to return (default 50, max 200)
   */
  static async getPuzzles(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        themes: themesParam,
        minRating: minRatingParam,
        maxRating: maxRatingParam,
        limit: limitParam,
      } = req.query;

      // Parse themes: comma-separated string → string[]
      const themes =
        typeof themesParam === "string" && themesParam.trim()
          ? themesParam
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [];

      // Parse and validate rating range
      const minRating = minRatingParam ? parseInt(minRatingParam as string, 10) : 0;
      const maxRating = maxRatingParam ? parseInt(maxRatingParam as string, 10) : 3000;
      const limit = limitParam ? parseInt(limitParam as string, 10) : 50;

      if (isNaN(minRating) || isNaN(maxRating) || isNaN(limit)) {
        return res.status(400).json({
          status: "fail",
          message: "minRating, maxRating, and limit must be valid integers.",
        });
      }

      if (minRating > maxRating) {
        return res.status(400).json({
          status: "fail",
          message: "minRating must be less than or equal to maxRating.",
        });
      }

      if (limit <= 0 || limit > 200) {
        return res.status(400).json({
          status: "fail",
          message: "limit must be between 1 and 200.",
        });
      }

      const puzzles = await PuzzleService.getPuzzles({
        themes,
        minRating,
        maxRating,
        limit,
      });

      res.status(200).json({
        status: "success",
        data: {
          count: puzzles.length,
          puzzles,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
