import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { reportError } from "../../realtime/observability/index.js";

export interface CustomError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[Error Middleware]: ${statusCode} - ${message}`);
  if (err.stack && env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Report to Rollbar. No-op when ROLLBAR_TOKEN is absent (local dev, CI).
  // 5xx errors are treated as fatal (infrastructure/code failures).
  // 4xx errors are non-fatal (client mistakes — informational only).
  reportError({
    domain: "http",
    error: err,
    fatal: statusCode >= 500,
    context: { statusCode, method: req.method, path: req.path },
  });

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

