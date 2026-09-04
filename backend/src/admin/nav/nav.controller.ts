import type { Request, Response, NextFunction } from "express";
import { NavService } from "./nav.service.js";

export class NavController {
  /**
   * Returns the authenticated admin's navigation tree.
   * GET /api/admin/nav
   */
  static async getNav(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await NavService.getNavForAdmin(req.adminUser!.id);

      res.status(200).json({
        status: "success",
        data: { items },
      });
    } catch (error) {
      next(error);
    }
  }
}
