import type { Request, Response, NextFunction } from "express";
import { StripeService } from "../services/StripeService.js";

export class CheckoutController {
  public static async createCheckoutSession(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { billing = "monthly", country } = req.body || {};
      const billingCycle = billing === "yearly" ? "yearly" : "monthly";

      if (!userId) {
        res.status(401).json({
          status: "fail",
          message: "Unauthorized. Please sign in to purchase a subscription.",
        });
        return;
      }

      // If client sent a country override (development only), inject it into
      // req.query so RegionService.detectRegion() can pick it up as a dev override.
      // This is safe: RegionService only respects it when NODE_ENV !== 'production'.
      if (country && typeof country === "string") {
        (req.query as Record<string, string>).country = country.toUpperCase();
      }

      console.log(
        `[CheckoutController]: billing=${billingCycle} | body.country=${country} | req.query.country=${req.query.country} | userId=${userId}`
      );

      const result = await StripeService.createDynamicCheckoutSession(billingCycle, req, userId);

      res.status(200).json({
        status: "success",
        url: result.url,
        checkoutUrl: result.url,
        currency: result.currency,
        symbol: result.symbol,
        amount: result.amount,
      });
    } catch (error: any) {
      console.error("[CheckoutController]: Error creating checkout session:", error);
      res.status(500).json({
        status: "fail",
        message: error.message || "Failed to create checkout session.",
      });
    }
  }
}
