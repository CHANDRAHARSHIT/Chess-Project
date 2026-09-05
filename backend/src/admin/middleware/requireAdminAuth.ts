import { getSession } from "@auth/express";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma.js";
import { adminAuthConfig } from "../auth/adminAuthConfig.js";

/**
 * Guards every /api/admin route. Mounts the AdminUser row on req.adminUser.
 */
export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await getSession(req, adminAuthConfig);

    if (!session?.user?.email) {
      return res.status(401).json({ status: "fail", message: "Unauthorized. Please sign in." });
    }

    // Re-read rather than trusting the session: a session issued before an admin
    // was deactivated must stop working immediately, not at expiry.
    const admin = await prisma.adminUser.findUnique({ where: { email: session.user.email } });

    if (!admin?.isActive) {
      return res.status(403).json({ status: "fail", message: "Admin access revoked." });
    }

    req.adminUser = admin;
    next();
  } catch (error) {
    next(error);
  }
}
