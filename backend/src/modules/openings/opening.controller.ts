import type { Request, Response, NextFunction } from "express";
import { OpeningService } from "./opening.service.js";

export class OpeningController {
  /**
   * Returns all chess openings from the database.
   * GET /api/openings
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const openings = await OpeningService.getAllOpenings();

      res.status(200).json({
        status: "success",
        data: { openings },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Returns a single chess opening by its database ID.
   * GET /api/openings/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== "string" || id.trim() === "") {
        return res.status(400).json({
          status: "fail",
          message: "A valid opening ID must be provided.",
        });
      }

      const opening = await OpeningService.getOpeningById(id);

      if (!opening) {
        return res.status(404).json({
          status: "fail",
          message: `Opening with ID '${id}' not found.`,
        });
      }

      res.status(200).json({
        status: "success",
        data: { opening },
      });
    } catch (error) {
      next(error);
    }
  }
}
