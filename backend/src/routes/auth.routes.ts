import { ExpressAuth } from "@auth/express";
import { authConfig } from "../config/auth.js";

// Export the ExpressAuth middleware handler directly.
// This must be mounted on a wildcard route (e.g. /api/auth/*) in the main app configuration
// so that the ExpressAuth basepath resolution helper can parse req.params[0] correctly.
export const authRouter = ExpressAuth(authConfig);
