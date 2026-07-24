import { useState, useEffect, useCallback } from "react";
import { PricingApi, type PricingResponse, type CheckoutResponse } from "../services/pricingApi";

const FALLBACK_PRICING: PricingResponse = {
  country: "New Zealand",
  countryCode: "NZ",
  currency: "NZD",
  symbol: "NZ$",
  monthly: 9,
  yearly: 35,
  locale: "en-NZ",
};

/**
 * Reads the ?country=XX URL parameter for development region overrides.
 * Returns undefined in production — the backend handles region detection.
 * Usage: /pricing?country=IN  → fetches INR pricing
 */
function getDevCountryOverride(): string | undefined {
  if (import.meta.env.PROD) return undefined;
  try {
    const params = new URLSearchParams(window.location.search);
    const country = params.get("country");
    return country?.toUpperCase() || undefined;
  } catch {
    return undefined;
  }
}

export function usePricing() {
  const [pricing, setPricing] = useState<PricingResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPricing = useCallback(async (countryOverride?: string) => {
    setLoading(true);
    setError(null);
    try {
      // In development, ?country=XX URL param overrides auto-detection.
      // In production the backend detects region from IP/headers automatically.
      const country = countryOverride || getDevCountryOverride();
      const data = await PricingApi.getPricing(country);
      setPricing(data);
    } catch (err: any) {
      console.warn("[usePricing]: Failed to fetch backend pricing, using fallback NZD pricing.", err);
      setError(err.message || "Failed to load local pricing. Displaying default NZD prices.");
      setPricing(FALLBACK_PRICING);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const createCheckout = useCallback(
    async (plan = "premium", billing: "monthly" | "yearly" = "monthly"): Promise<CheckoutResponse> => {
      try {
        // Pass country code so backend creates Stripe session in same currency as displayed
        const country = getDevCountryOverride() || pricing?.countryCode;
        return await PricingApi.createCheckout(plan, billing, country);
      } catch (err: any) {
        console.error("[usePricing]: Checkout error:", err);
        return {
          status: "fail",
          message: err.message || "Checkout failed.",
        };
      }
    },
    [pricing?.countryCode]
  );

  return {
    pricing: pricing || FALLBACK_PRICING,
    loading,
    error,
    createCheckout,
    refetchPricing: fetchPricing,
  };
}
