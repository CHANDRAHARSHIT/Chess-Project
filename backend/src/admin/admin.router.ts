import { Router } from "express";
import { requireAdminAuth } from "./middleware/requireAdminAuth.js";
import { NavController } from "./nav/nav.controller.js";
import { DocumentController } from "./documents/document.controller.js";

export const adminRouter = Router();

// Guard the whole router, not each route: a route added later cannot land
// unguarded. /api/admin/auth/* is mounted ahead of this in app.ts and is
// deliberately outside it.
adminRouter.use(requireAdminAuth);

// Identity for the admin shell (avatar menu, route guard). 401 here is the
// frontend's signal to send the user back to /admin.
adminRouter.get("/session", (req, res) => {
  const { id, email, name, avatarUrl, role } = req.adminUser!;
  res.status(200).json({ status: "success", data: { admin: { id, email, name, avatarUrl, role } } });
});

adminRouter.get("/nav", NavController.getNav);

adminRouter.get("/documents", DocumentController.list);
adminRouter.post("/documents", DocumentController.create);
adminRouter.get("/documents/:id", DocumentController.getById);
adminRouter.patch("/documents/:id", DocumentController.update);
adminRouter.delete("/documents/:id", DocumentController.remove);
