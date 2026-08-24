import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const userRouter = Router();

// Public rankings endpoint
userRouter.get("/leaderboard", UserController.getLeaderboard);

// Protected user profile endpoint
userRouter.get("/profile", requireAuth, UserController.getProfile);

// Protected session invalidation endpoint
userRouter.post("/logout-all", requireAuth, UserController.logoutAll);
