export interface CachedRatesData {
  baseCurrency: string;
  rates: Record<string, number>;
  timestamp: number;
}

export class ExchangeRateCache {
  private static instance: ExchangeRateCache;
  private cache: CachedRatesData | null = null;
  // Cache validity TTL: 12 to 24 hours (defaulting to 12 hours)
  private readonly ttlMs: number = 12 * 60 * 60 * 1000;

  private constructor() {}

  public static getInstance(): ExchangeRateCache {
    if (!ExchangeRateCache.instance) {
      ExchangeRateCache.instance = new ExchangeRateCache();
    }
    return ExchangeRateCache.instance;
  }

  public getRates(): Record<string, number> | null {
    if (!this.cache) {
      return null;
    }

    const isExpired = Date.now() - this.cache.timestamp > this.ttlMs;
    if (isExpired) {
      console.log("[ExchangeRateCache]: Cache expired.");
      return null;
    }

    return this.cache.rates;
  }

  public setRates(rates: Record<string, number>, baseCurrency = "NZD"): void {
    console.log(`[ExchangeRateCache]: Caching exchange rates for base currency ${baseCurrency}`);
    this.cache = {
      baseCurrency,
      rates,
      timestamp: Date.now(),
    };
  }

  public clear(): void {
    this.cache = null;
  }
}
