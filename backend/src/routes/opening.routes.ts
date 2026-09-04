import { Router } from "express";
import { OpeningController } from "../controllers/opening.controller.js";

export const openingRouter = Router();

// Public endpoint — get all openings
openingRouter.get("/", OpeningController.getAll);

// Public endpoint — get a single opening by ID
openingRouter.get("/:id", OpeningController.getById);
