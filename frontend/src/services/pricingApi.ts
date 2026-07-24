export interface PricingResponse {
  country: string;
  countryCode: string;
  currency: string;
  symbol: string;
  monthly: number;
  yearly: number;
  locale: string;
}

export interface CheckoutRequest {
  plan: string;
  billing: "monthly" | "yearly";
}

export interface CheckoutResponse {
  status: "success" | "fail";
  url?: string;
  checkoutUrl?: string;
  currency?: string;
  amount?: number;
  message?: string;
}

export class PricingApi {
  /**
   * Fetches dynamic regional pricing from backend GET /api/pricing
   */
  public static async getPricing(country?: string): Promise<PricingResponse> {
    const url = country ? `/api/pricing?country=${country}` : "/api/pricing";
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Pricing API returned status ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Spawns Stripe Checkout session via backend POST /api/checkout
   */
  public static async createCheckout(
    plan = "premium",
    billing: "monthly" | "yearly" = "monthly",
    country?: string
  ): Promise<CheckoutResponse> {
    // country is sent in the POST body so it is never lost if the URL changes
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan, billing, country }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to initialize checkout session.");
    }

    return await response.json();
  }
}
