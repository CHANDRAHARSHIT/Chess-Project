import { Router } from "express";
import { requireAdminAuth } from "./middleware/requireAdminAuth.js";
import { SessionController } from "./session/session.controller.js";
import { NavController } from "./nav/nav.controller.js";
import { DocumentController } from "./documents/document.controller.js";

/**
 * Every authenticated admin route, mounted at /api/admin.
 *
 * requireAdminAuth guards the whole router rather than each route, so a route
 * added later cannot land unguarded. /api/admin/auth/* is mounted ahead of this
 * in app.ts and is deliberately outside the guard.
 */
export const adminRouter = Router();

adminRouter.use(requireAdminAuth);

adminRouter.get("/session", SessionController.getAdminSession);

adminRouter.get("/nav", NavController.getNav);

adminRouter.get("/documents", DocumentController.listDocuments);
adminRouter.post("/documents", DocumentController.createDocument);
adminRouter.get("/documents/:id", DocumentController.getDocumentById);
adminRouter.patch("/documents/:id", DocumentController.updateDocument);
adminRouter.delete("/documents/:id", DocumentController.deleteDocument);
