/**
 * Restricts ACS admin routes to an env allowlist. Stands in for a role column;
 * replace this file when real roles exist.
 *
 * Run after requireAuth, which populates req.user.
 */

import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

function buildAllowlist(): Set<string> {
  return new Set(
    env.ACS_ADMIN_EMAILS.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email !== "")
  );
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const allowlist = buildAllowlist();
  const email = req.user?.email?.toLowerCase();

  // An empty allowlist denies everyone: a misconfigured env must not open the queue.
  if (!email || !allowlist.has(email)) {
    return res.status(403).json({
      status: "fail",
      message: "Admin access required.",
    });
  }

  next();
}
