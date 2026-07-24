import { Router } from "express";
import { CheckoutController } from "../controllers/CheckoutController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const checkoutRouter = Router();

checkoutRouter.post("/", requireAuth, CheckoutController.createCheckoutSession);

export { checkoutRouter };
