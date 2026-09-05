import type { Request, Response, NextFunction } from "express";
import { NavService } from "./nav.service.js";

const HTTP_OK = 200;

/**
 * HTTP layer for /api/admin/nav.
 *
 * Thin by design: the visibility rules live in NavService.
 */
export class NavController {
  /** GET /api/admin/nav — the authenticated admin's navigation tree. */
  static async getNav(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await NavService.getNavForAdmin(req.adminUser!.id);

      res.status(HTTP_OK).json({ status: "success", data: { items } });
    } catch (error) {
      next(error);
    }
  }
}
