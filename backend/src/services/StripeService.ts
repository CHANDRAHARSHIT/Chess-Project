import Stripe from "stripe";
import type { Request } from "express";
import { env } from "../config/env.js";
import { PricingService } from "./PricingService.js";
import { CurrencyFormatter } from "../utils/CurrencyFormatter.js";
import { PaymentService } from "./payment.service.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-06-24.dahlia" as any,
});

export class StripeService {
  /**
   * Creates a Stripe Checkout session dynamically in the user's detected local currency.
   * Stores all pricing metadata in the session so the Success page can display
   * the exact amount/currency without any frontend currency logic.
   */
  public static async createDynamicCheckoutSession(
    billing: "monthly" | "yearly",
    req: Request,
    userId?: string
  ): Promise<{ url: string; currency: string; amount: number; symbol: string }> {
    if (!userId) {
      throw new Error("Authentication required to create a checkout session.");
    }

    // 1. Detect region and fetch pricing DTO for user's request
    const pricing = await PricingService.getPricingForRequest(req);

    const isYearly = billing === "yearly";
    const amountInCurrency = isYearly ? pricing.yearly : pricing.monthly;
    const currency = pricing.currency.toLowerCase();

    // 2. Convert to minor units (e.g. INR 483 -> 48300, JPY 950 -> 950)
    const unitAmount = CurrencyFormatter.toMinorUnits(amountInCurrency, currency);

    const productName = isYearly ? "XLChess Premium (Yearly)" : "XLChess Premium (Monthly)";
    const interval = isYearly ? "year" : "month";

    console.log(
      `[StripeService]: Creating session in ${currency.toUpperCase()} - ` +
      `Amount: ${pricing.symbol}${amountInCurrency} (${unitAmount} minor units) ` +
      `for user ${userId} on ${billing} plan`
    );

    // 3. Resolve or create Stripe Customer (links session to user account)
    let customerId: string | undefined;
    try {
      customerId = await PaymentService.getOrCreateCustomer(userId);
    } catch (e) {
      console.warn(`[StripeService]: Failed to resolve customer for user ${userId}`, e);
    }

    // 4. Create Stripe Checkout Session using dynamic price_data
    //    All pricing context is stored in metadata for the Success page
    const sessionParams: any = {
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: productName,
              description: `Unlimited Stockfish engine analysis, game reviews, and premium features.`,
            },
            unit_amount: unitAmount,
            recurring: {
              interval: interval,
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url:
        env.STRIPE_SUCCESS_URL ||
        `${env.CLIENT_ORIGIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: env.STRIPE_CANCEL_URL || `${env.CLIENT_ORIGIN}/pricing`,
      metadata: {
        userId,
        billing,
        currency: pricing.currency,
        symbol: pricing.symbol,
        locale: pricing.locale,
        country: pricing.country,
        countryCode: pricing.countryCode,
        amountFormatted: `${pricing.symbol}${amountInCurrency}`,
        amountRaw: String(amountInCurrency),
        unitAmount: String(unitAmount),
      },
      allow_promotion_codes: true,
    };

    let session: any;
    try {
      session = await stripe.checkout.sessions.create(sessionParams);
    } catch (stripeErr: any) {
      // Stripe prevents mixing currencies on a single customer
      // (e.g. customer has existing USD sessions, now creating INR).
      // Fall back to a guest session (no customer attached) so checkout
      // still works. The webhook will link the subscription to the user via metadata.userId.
      if (
        stripeErr?.raw?.code === "currency_combination_invalid" ||
        stripeErr?.message?.toLowerCase().includes("cannot combine currencies")
      ) {
        console.warn(
          `[StripeService]: Customer ${customerId} has a currency conflict. ` +
          `Retrying as guest session in ${currency.toUpperCase()}.`
        );
        const { customer: _removed, ...paramsWithoutCustomer } = sessionParams;
        session = await stripe.checkout.sessions.create(paramsWithoutCustomer);
      } else {
        throw stripeErr;
      }
    }

    if (!session.url) {
      throw new Error("Stripe Checkout failed to generate redirect URL.");
    }

    return {
      url: session.url,
      currency: pricing.currency,
      amount: amountInCurrency,
      symbol: pricing.symbol,
    };
  }
}
