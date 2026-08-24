import { getSession } from "@auth/express";
import type { Request, Response, NextFunction } from "express";
import { authConfig } from "../config/auth.js";

/**
 * Express middleware that checks for a valid session using Auth.js.
 * If unauthorized, returns a 401 JSON response; otherwise, mounts the session onto the Request object.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await getSession(req, authConfig);
    
    if (!session || !session.user) {
      return res.status(401).json({
        status: "fail",
        message: "Unauthorized. Please sign in.",
      });
    }

    // Mount user details and full session details onto Express Request
    req.user = session.user;
    req.session = session;

    next();
  } catch (error) {
    next(error);
  }
}
