import { Router } from "express";
import { CustomLinksController } from "../controllers/customLinks.controller.js";
import { requireAuth } from "../core/middleware/auth.middleware.js";

export const customLinksRouter = Router();

// All custom links routes require authentication
customLinksRouter.use(requireAuth);

customLinksRouter.get("/", CustomLinksController.getLinks);
customLinksRouter.post("/", CustomLinksController.createLink);
customLinksRouter.put("/:id", CustomLinksController.updateLink);
customLinksRouter.delete("/:id", CustomLinksController.deleteLink);
