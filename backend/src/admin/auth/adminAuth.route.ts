import { ExpressAuth } from "@auth/express";
import { adminAuthConfig } from "./adminAuthConfig.js";

// Mount on a wildcard route (/api/admin/auth/*) so ExpressAuth can resolve its
// base path from req.params[0].
export const adminAuthRouter = ExpressAuth(adminAuthConfig);
