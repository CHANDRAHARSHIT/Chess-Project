import type { Request, Response } from "express";

const HTTP_OK = 200;

/**
 * HTTP layer for /api/admin/session.
 *
 * The admin row is already loaded and validated by requireAdminAuth, so there is
 * no service or repository behind this — it only shapes what the shell needs.
 */
export class SessionController {
  /** GET /api/admin/session — identity for the avatar menu and the route guard. */
  static getAdminSession(req: Request, res: Response) {
    const { id, email, name, avatarUrl, role } = req.adminUser!;

    res.status(HTTP_OK).json({
      status: "success",
      data: { admin: { id, email, name, avatarUrl, role } },
    });
  }
}
