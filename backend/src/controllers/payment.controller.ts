import type { Request, Response, NextFunction } from "express";
import { PaymentService } from "../services/payment.service.js";
import { SubscriptionTier } from "../types/payment.js";

export class PaymentController {
  /**
   * Generates a billing checkout portal session for the logged-in user.
   * POST /api/payments/checkout
   */
  static async createCheckoutSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { plan, planId } = req.body as { plan?: string; planId?: string };
      const selectedPlan = plan || planId;

      if (!userId) {
        return res.status(401).json({ status: "fail", message: "Unauthorized. Session not found." });
      }

      if (!selectedPlan || !["pro_monthly", "pro_yearly"].includes(selectedPlan)) {
        return res.status(400).json({ status: "fail", message: "Invalid or missing billing plan ID." });
      }

      const { url: checkoutUrl, sessionId } = await PaymentService.createCheckoutSession(userId, selectedPlan);

      return res.status(200).json({
        status: "success",
        checkoutUrl,
        sessionId,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Spawns a customer billing self-service manager link.
   * POST /api/payments/portal
   */
  static async createBillingPortalSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ status: "fail", message: "Unauthorized. Session not found." });
      }

      const portalUrl = await PaymentService.createBillingPortalSession(userId);

      return res.status(200).json({
        status: "success",
        portalUrl,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Receives asynchronous lifecycle notifications from the Payment Provider.
   * POST /api/payments/webhook
   */
  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers["stripe-signature"] as string;

      if (!signature) {
        return res.status(400).json({ status: "fail", message: "Missing cryptographic webhook signature." });
      }

      // We read the raw body. In Express app.ts, we configure express.raw for this specific endpoint path.
      // If it has been parsed, we convert it to string/Buffer.
      const rawBody = req.body;

      const result = await PaymentService.handleWebhookEvent(rawBody, signature);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves checkout session details for the logged-in user to verify success.
   * GET /api/payments/checkout-session/:sessionId
   */
  static async getCheckoutSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { sessionId } = req.params;

      if (!userId) {
        return res.status(401).json({ status: "fail", message: "Unauthorized. Session not found." });
      }

      if (!sessionId) {
        return res.status(400).json({ status: "fail", message: "Missing checkout session ID." });
      }

      const details = await PaymentService.getCheckoutSessionDetails(sessionId, userId);

      return res.status(200).json({
        status: "success",
        data: details,
      });
    } catch (error) {
      next(error);
    }
  }
}
