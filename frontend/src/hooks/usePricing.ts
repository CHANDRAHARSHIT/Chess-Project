import { useState, useEffect, useCallback } from "react";
import { PricingApi, type PricingResponse } from "../services/pricingApi";
import rollbar from "../config/rollbar";

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
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(
    getDevCountryOverride()
  );

  const fetchPricing = useCallback(async (countryOverride?: string) => {
    setError(null);
    try {
      const country =
        countryOverride ||
        selectedCountry ||
        getDevCountryOverride();

      if (countryOverride) {
        setSelectedCountry(countryOverride);
      }

      const data = await PricingApi.getPricing(country);
      setPricing(data);
    } catch (err: unknown) {
      console.warn("[usePricing]: Failed to fetch backend pricing, using fallback NZD pricing.", err);
      // Falls back to NZD pricing below, so this never reaches the
      // ErrorBoundary — report it manually since it affects checkout pricing.
      rollbar.error(err instanceof Error ? err : new Error(String(err)), { context: "usePricing.fetchPricing" });
      setError(err instanceof Error ? err.message : "Failed to load local pricing. Displaying default NZD prices.");
      setPricing(FALLBACK_PRICING);
    }
  }, [selectedCountry]);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  return {
    pricing: pricing || FALLBACK_PRICING,
    error,
    refetchPricing: fetchPricing,
  };
}

