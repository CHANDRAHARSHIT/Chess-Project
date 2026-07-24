import type { Request } from "express";
import { RegionService } from "./RegionService.js";
import { CurrencyService } from "./CurrencyService.js";
import { CurrencyFormatter } from "../utils/CurrencyFormatter.js";

export interface PricingDTO {
  country: string;
  countryCode: string;
  currency: string;
  symbol: string;
  monthly: number;
  yearly: number;
  locale: string;
  baseMonthlyNZD: number;
  baseYearlyNZD: number;
}

export class PricingService {
  // Source of Truth Prices in NZD (Must NEVER change)
  public static readonly BASE_MONTHLY_NZD = 8.64;
  public static readonly BASE_YEARLY_NZD = 35.25;

  /**
   * Generates the regional pricing DTO for an incoming request.
   */
  public static async getPricingForRequest(req?: Request): Promise<PricingDTO> {
    try {
      const region = await RegionService.detectRegion(req);
      return await this.getPricingForRegion(region.currency, region.country, region.countryCode, region.locale);
    } catch (error) {
      console.error("[PricingService]: Error calculating dynamic pricing, returning NZD fallback:", error);
      return this.getFallbackNZDPricing();
    }
  }

  /**
   * Calculates dynamic pricing for a given currency code.
   */
  public static async getPricingForRegion(
    currency: string,
    country = "New Zealand",
    countryCode = "NZ",
    locale = "en-NZ"
  ): Promise<PricingDTO> {
    const symbol = CurrencyFormatter.getSymbol(currency);
    const isZeroDecimal = CurrencyFormatter.isZeroDecimal(currency);

    const { convertedAmount: monthlyConverted } = await CurrencyService.convertNZD(
      this.BASE_MONTHLY_NZD,
      currency
    );

    const { convertedAmount: yearlyConverted } = await CurrencyService.convertNZD(
      this.BASE_YEARLY_NZD,
      currency
    );

    // Format amounts: round to integer if large or zero decimal currency, else standard round
    const monthly = isZeroDecimal ? Math.round(monthlyConverted) : Math.round(monthlyConverted);
    const yearly = isZeroDecimal ? Math.round(yearlyConverted) : Math.round(yearlyConverted);

    return {
      country,
      countryCode,
      currency: currency.toUpperCase(),
      symbol,
      monthly,
      yearly,
      locale,
      baseMonthlyNZD: this.BASE_MONTHLY_NZD,
      baseYearlyNZD: this.BASE_YEARLY_NZD,
    };
  }

  public static getFallbackNZDPricing(): PricingDTO {
    return {
      country: "New Zealand",
      countryCode: "NZ",
      currency: "NZD",
      symbol: "NZ$",
      monthly: 9, // Math.round(8.64) or 8.64
      yearly: 35,
      locale: "en-NZ",
      baseMonthlyNZD: this.BASE_MONTHLY_NZD,
      baseYearlyNZD: this.BASE_YEARLY_NZD,
    };
  }
}
