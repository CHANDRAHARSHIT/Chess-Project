import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import rollbar from "../config/rollbar.js";

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

  // Report server errors (5xx) to Rollbar; skip client errors (4xx) intentionally.
  if (statusCode >= 500) {
    rollbar.error(err, req);
  }

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

