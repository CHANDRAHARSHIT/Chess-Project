import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const paymentRouter = Router();

// Protected Checkout and Customer Portal Endpoints
paymentRouter.post("/create-session", requireAuth, PaymentController.createCheckoutSession);
paymentRouter.post("/portal", requireAuth, PaymentController.createBillingPortalSession);
paymentRouter.get("/checkout-session/:sessionId", requireAuth, PaymentController.getCheckoutSession);

// Webhook endpoint (Requires raw request stream bypass, secured by signature verification)
paymentRouter.post("/webhook", PaymentController.handleWebhook);
