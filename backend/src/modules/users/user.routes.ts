import { Router } from "express";
import { UserController } from "./user.controller.js";
import { requireAuth } from "../../core/middleware/auth.middleware.js";

export const userRouter = Router();

// Public rankings endpoint
userRouter.get("/leaderboard", UserController.getLeaderboard);

// Protected user profile endpoint
userRouter.get("/profile", requireAuth, UserController.getProfile);

// Protected session invalidation endpoint
userRouter.post("/logout-all", requireAuth, UserController.logoutAll);
