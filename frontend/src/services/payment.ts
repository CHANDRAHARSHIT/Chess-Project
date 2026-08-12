import type { CheckoutSessionResponse, BillingPortalResponse, GetCheckoutSessionResponse } from "@/types/payment";
import rollbar from "@/config/rollbar";

export class PaymentService {
  /**
   * Triggers the backend to spawn a Stripe/gateway Checkout Session for a specific tier.
   */
  static async createCheckoutSession(plan: string): Promise<CheckoutSessionResponse> {
    try {
      const response = await fetch("/api/payments/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to initialize checkout session.");
      }

      return await response.json();
    } catch (error: unknown) {
      console.error("[PaymentService.createCheckoutSession] Error:", error);
      // Swallowed into a "fail" response here rather than thrown, so this
      // never reaches the ErrorBoundary — report it manually.
      rollbar.error(error instanceof Error ? error : new Error(String(error)), { context: "PaymentService.createCheckoutSession" });
      return {
        status: "fail",
        message: error instanceof Error ? error.message : "An unexpected error occurred.",
      };
    }
  }

  /**
   * Requests a self-service customer portal session URL from the backend.
   */
  static async createBillingPortalSession(): Promise<BillingPortalResponse> {
    try {
      const response = await fetch("/api/payments/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to initialize customer portal.");
      }

      return await response.json();
    } catch (error: unknown) {
      console.error("[PaymentService.createBillingPortalSession] Error:", error);
      rollbar.error(error instanceof Error ? error : new Error(String(error)), { context: "PaymentService.createBillingPortalSession" });
      return {
        status: "fail",
        message: error instanceof Error ? error.message : "An unexpected error occurred.",
      };
    }
  }

  /**
   * Retrieves checkout session details from the backend for success verification.
   */
  static async getCheckoutSession(sessionId: string): Promise<GetCheckoutSessionResponse> {
    try {
      const response = await fetch(`/api/payments/checkout-session/${sessionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to retrieve checkout session details.");
      }

      return await response.json();
    } catch (error: unknown) {
      console.error("[PaymentService.getCheckoutSession] Error:", error);
      rollbar.error(error instanceof Error ? error : new Error(String(error)), { context: "PaymentService.getCheckoutSession" });
      return {
        status: "fail",
        message: error instanceof Error ? error.message : "An unexpected error occurred.",
      };
    }
  }
}
