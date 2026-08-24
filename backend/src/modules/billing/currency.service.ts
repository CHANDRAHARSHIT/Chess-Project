import { ExchangeRateCache } from "./exchange-rate.cache.js";
import rollbar from "../../core/config/rollbar.config.js";

const FALLBACK_NZD_EXCHANGE_RATES: Record<string, number> = {
  NZD: 1.0,
  USD: 0.60,
  EUR: 0.55,
  GBP: 0.47,
  AUD: 0.90,
  CAD: 0.82,
  INR: 51.0,
  JPY: 95.0,
  CNY: 4.3,
  SGD: 0.81,
  CHF: 0.53,
  HKD: 4.7,
  BRL: 3.3,
  MXN: 10.8,
  KRW: 830.0,
  SEK: 6.4,
  NOK: 6.5,
  DKK: 4.1,
  ZAR: 10.9,
  AED: 2.2,
  SAR: 2.25,
  THB: 21.5,
  IDR: 9800.0,
  MYR: 2.8,
  PHP: 35.0,
  VND: 15000.0,
};

export class CurrencyService {
  /**
   * Fetches latest exchange rates with NZD base currency. Uses cache if valid.
   */
  public static async getExchangeRates(): Promise<Record<string, number>> {
    const cachedRates = ExchangeRateCache.getRates();
    if (cachedRates) {
      console.log("[CurrencyService]: Using cached exchange rates...");
      return cachedRates;
    }

    try {
      console.log("[CurrencyService]: Fetching live exchange rates for NZD...");
      const response = await fetch("https://open.er-api.com/v6/latest/NZD", {
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.rates) {
          ExchangeRateCache.setRates(data.rates, "NZD");
          return data.rates;
        }
      }
      console.warn("[CurrencyService]: Live FX API response invalid, using fallback rates.");
    } catch (error) {
      console.error("[CurrencyService]: FX API request failed:", error);
      // Falls back to static rates below, so this never surfaces as a 5xx —
      // report it manually so a prolonged FX outage doesn't go unnoticed.
      rollbar.error(error as Error, { context: "CurrencyService.getExchangeRates" });
    }

    // Cache fallback rates temporarily so repeated failures don't bombard network
    ExchangeRateCache.setRates(FALLBACK_NZD_EXCHANGE_RATES, "NZD");
    return FALLBACK_NZD_EXCHANGE_RATES;
  }

  /**
   * Calculates converted price from NZD amount to target currency.
   */
  public static async convertNZD(
    nzdAmount: number,
    targetCurrency: string
  ): Promise<{ convertedAmount: number; rate: number }> {
    const code = targetCurrency.toUpperCase();
    if (code === "NZD") {
      return { convertedAmount: nzdAmount, rate: 1.0 };
    }

    const rates = await this.getExchangeRates();
    const rate = rates[code] || FALLBACK_NZD_EXCHANGE_RATES[code] || 1.0;

    return {
      convertedAmount: nzdAmount * rate,
      rate,
    };
  }
}