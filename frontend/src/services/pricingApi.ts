export interface PricingResponse {
  country: string;
  countryCode: string;
  currency: string;
  symbol: string;
  monthly: number;
  yearly: number;
  locale: string;
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
}
