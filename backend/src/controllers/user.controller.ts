import type { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service.js";

export class UserController {
  /**
   * Fetches the profile details of the currently authenticated user.
   */
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          status: "fail",
          message: "Unauthorized.",
        });
      }

      const user = await UserService.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          status: "fail",
          message: "User profile not found in database.",
        });
      }

      res.status(200).json({
        status: "success",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetches the chess leaderboard rankings.
   */
  static async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const rawLimit = (req.query.limit as string) || "10";
      const limit = parseInt(rawLimit, 10);

      // Validate range: limit must be a positive integer between 1 and 100
      if (isNaN(limit) || limit <= 0 || limit > 100 || String(limit) !== rawLimit.trim()) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid limit parameter. Must be a positive integer between 1 and 100.",
        });
      }

      const leaderboard = await UserService.getLeaderboard(limit);

      res.status(200).json({
        status: "success",
        data: { leaderboard },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invalidates all active sessions for the currently authenticated user.
   */
  static async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          status: "fail",
          message: "Unauthorized.",
        });
      }

      await UserService.logoutAll(userId);

      res.status(200).json({
        status: "success",
        message: "Successfully signed out of all devices.",
      });
    } catch (error) {
      next(error);
    }
  }
}
