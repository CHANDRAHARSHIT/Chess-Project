import type { Request, Response, NextFunction } from "express";
import { PricingService } from "../services/pricing.service.js";
import rollbar from "../config/rollbar.config.js";

export class PricingController {
  public static async getPricing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pricing = await PricingService.getPricingForRequest(req);
      
      res.status(200).json({
        country: pricing.country,
        countryCode: pricing.countryCode,
        currency: pricing.currency,
        symbol: pricing.symbol,
        monthly: pricing.monthly,
        yearly: pricing.yearly,
        locale: pricing.locale,
      });
    } catch (error) {
      console.error("[PricingController]: Error fetching pricing:", error);
      // Falls back to NZD rather than a 5xx, so this never reaches the global
      // error middleware — report it manually so the failure stays visible.
      rollbar.error(error as Error, req);
      // Fallback response to prevent app crashes
      const fallback = PricingService.getFallbackNZDPricing();
      res.status(200).json({
        country: fallback.country,
        countryCode: fallback.countryCode,
        currency: fallback.currency,
        symbol: fallback.symbol,
        monthly: fallback.monthly,
        yearly: fallback.yearly,
        locale: fallback.locale,
      });
    }
  }
}
