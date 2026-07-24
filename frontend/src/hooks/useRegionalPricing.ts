import { useState, useEffect } from "react";

const CACHE_KEY_GEO = "chess_app_geo_currency";
const CACHE_KEY_RATES = "chess_app_exchange_rates";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CachedGeo {
  currency: string;
  timestamp: number;
}

interface CachedRates {
  rates: Record<string, number>;
  timestamp: number;
}

const TIMEZONE_TO_CURRENCY: Record<string, string> = {
  "Asia/Kolkata": "INR",
  "Asia/Calcutta": "INR",
  "Europe/London": "GBP",
  "Europe/Paris": "EUR",
  "Europe/Berlin": "EUR",
  "Europe/Rome": "EUR",
  "Europe/Madrid": "EUR",
  "Australia/Sydney": "AUD",
  "Australia/Melbourne": "AUD",
  "America/New_York": "USD",
  "America/Chicago": "USD",
  "America/Denver": "USD",
  "America/Los_Angeles": "USD",
  "America/Toronto": "CAD",
  "America/Vancouver": "CAD",
  "Asia/Tokyo": "JPY",
  "Pacific/Auckland": "NZD",
};

const LOCALE_TO_CURRENCY: Record<string, string> = {
  "en-US": "USD",
  "en-GB": "GBP",
  "en-AU": "AUD",
  "en-NZ": "NZD",
  "en-CA": "CAD",
  "fr-FR": "EUR",
  "de-DE": "EUR",
  "it-IT": "EUR",
  "es-ES": "EUR",
  "ja-JP": "JPY",
  "hi-IN": "INR",
  "en-IN": "INR",
};

const FALLBACK_EXCHANGE_RATES: Record<string, number> = {
  "NZD": 1.0,
  "USD": 0.60,
  "EUR": 0.55,
  "GBP": 0.47,
  "AUD": 0.90,
  "CAD": 0.82,
  "INR": 51.0,
  "JPY": 95.0,
  "CNY": 4.3,
  "SGD": 0.81,
  "CHF": 0.53,
  "HKD": 4.7,
};

function getFallbackCurrency(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_CURRENCY[tz]) {
      return TIMEZONE_TO_CURRENCY[tz];
    }
  } catch (e) {}

  const locale = navigator.language || "en-US";
  if (LOCALE_TO_CURRENCY[locale]) {
    return LOCALE_TO_CURRENCY[locale];
  }
  
  const prefix = locale.split("-")[0];
  const prefixMap: Record<string, string> = {
    "fr": "EUR",
    "de": "EUR",
    "it": "EUR",
    "es": "EUR",
    "ja": "JPY",
    "hi": "INR",
    "en": "USD",
  };
  return prefixMap[prefix] || "NZD";
}

export function useRegionalPricing() {
  const [currency, setCurrency] = useState<string>(() => {
    try {
      const cachedGeoStr = localStorage.getItem(CACHE_KEY_GEO);
      if (cachedGeoStr) {
        const cachedGeo: CachedGeo = JSON.parse(cachedGeoStr);
        if (Date.now() - cachedGeo.timestamp < CACHE_EXPIRY) {
          return cachedGeo.currency;
        }
      }
    } catch (e) {}
    return getFallbackCurrency();
  });

  const [rates, setRates] = useState<Record<string, number>>(() => {
    try {
      const cachedRatesStr = localStorage.getItem(CACHE_KEY_RATES);
      if (cachedRatesStr) {
        const cachedRates: CachedRates = JSON.parse(cachedRatesStr);
        if (Date.now() - cachedRates.timestamp < CACHE_EXPIRY) {
          return cachedRates.rates;
        }
      }
    } catch (e) {}
    return FALLBACK_EXCHANGE_RATES;
  });

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initPricing() {
      try {
        let detectedCurrency = currency;
        
        // 1. Validate / Refresh Geo Currency Cache
        const cachedGeoStr = localStorage.getItem(CACHE_KEY_GEO);
        let needsGeoFetch = true;
        if (cachedGeoStr) {
          const cachedGeo: CachedGeo = JSON.parse(cachedGeoStr);
          if (Date.now() - cachedGeo.timestamp < CACHE_EXPIRY) {
            detectedCurrency = cachedGeo.currency;
            needsGeoFetch = false;
          }
        }

        if (needsGeoFetch) {
          try {
            const geoRes = await fetch("https://ipapi.co/json/");
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData.currency) {
                detectedCurrency = geoData.currency;
                localStorage.setItem(
                  CACHE_KEY_GEO,
                  JSON.stringify({ currency: detectedCurrency, timestamp: Date.now() })
                );
                setCurrency(detectedCurrency);
              }
            }
          } catch (e) {
            console.warn("IP Geolocation API failed, using fallback currency.", e);
          }
        }

        // 2. Validate / Refresh Exchange Rates Cache
        const cachedRatesStr = localStorage.getItem(CACHE_KEY_RATES);
        let needsRatesFetch = true;
        if (cachedRatesStr) {
          const cachedRates: CachedRates = JSON.parse(cachedRatesStr);
          if (Date.now() - cachedRates.timestamp < CACHE_EXPIRY) {
            setRates(cachedRates.rates);
            needsRatesFetch = false;
          }
        }

        if (needsRatesFetch) {
          try {
            const ratesRes = await fetch("https://open.er-api.com/v6/latest/NZD");
            if (ratesRes.ok) {
              const ratesData = await ratesRes.json();
              if (ratesData.rates) {
                setRates(ratesData.rates);
                localStorage.setItem(
                  CACHE_KEY_RATES,
                  JSON.stringify({ rates: ratesData.rates, timestamp: Date.now() })
                );
              }
            }
          } catch (e) {
            console.warn("Exchange rates API failed, using static fallbacks.", e);
          }
        }
      } catch (err) {
        console.error("Error in regional pricing initialization:", err);
      } finally {
        setLoading(false);
      }
    }

    initPricing();
  }, []);

  const getExchangeRate = (targetCurrency: string): number => {
    return rates[targetCurrency] || FALLBACK_EXCHANGE_RATES[targetCurrency] || 1.0;
  };

  const convertPrice = (nzdAmount: number): { amount: number; formatted: string } => {
    const rate = getExchangeRate(currency);
    const converted = nzdAmount * rate;
    
    let formatted = "";
    try {
      formatted = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency,
      }).format(converted);
    } catch (e) {
      formatted = `$${converted.toFixed(2)}`;
    }
    
    return {
      amount: converted,
      formatted: `${formatted} ${currency}`,
    };
  };

  return {
    currency,
    loading,
    convertPrice,
  };
}
