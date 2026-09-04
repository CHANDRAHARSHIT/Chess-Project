export interface CachedRatesData {
  baseCurrency: string;
  rates: Record<string, number>;
  timestamp: number;
}

// Cache validity TTL: 12 hours
const TTL_MS = 12 * 60 * 60 * 1000;

let cache: CachedRatesData | null = null;

export const ExchangeRateCache = {
  getRates(): Record<string, number> | null {
    if (!cache) return null;

    const isExpired = Date.now() - cache.timestamp > TTL_MS;
    if (isExpired) {
      console.log("[ExchangeRateCache]: Cache expired.");
      return null;
    }

    return cache.rates;
  },

  setRates(rates: Record<string, number>, baseCurrency = "NZD"): void {
    console.log(`[ExchangeRateCache]: Caching exchange rates for base currency ${baseCurrency}`);
    cache = { baseCurrency, rates, timestamp: Date.now() };
  },

  clear(): void {
    cache = null;
  },
};