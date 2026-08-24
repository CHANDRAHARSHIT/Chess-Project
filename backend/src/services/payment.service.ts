import { prisma } from "../core/database/prisma.js";
import { env } from "../core/config/env.js";
import Stripe from "stripe";
import { CurrencyFormatter } from "../utils/CurrencyFormatter.js";
import {
  handleSubscriptionCreatedOrUpdated,
  handleSubscriptionDeleted,
  handleSubscriptionTrialWillEnd,
} from "./payment/subscription-handler.js";
import {
  handleCheckoutSessionCompleted,
  handleCheckoutSessionExpired,
  handleCheckoutSessionAsyncPaymentSucceeded,
  handleCheckoutSessionAsyncPaymentFailed,
} from "./payment/checkout-handler.js";
import {
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
  handleInvoicePaymentActionRequired,
} from "./payment/invoice-handler.js";
import {
  handleChargeDisputeCreated,
} from "./payment/charge-handler.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-06-24.dahlia" as any,
});

/**
 * Returns true when the configured Stripe key is a live-mode key.
 * Stripe live keys always start with `sk_live_`; test keys start with `sk_test_`.
 */
function isLiveMode(): boolean {
  return (env.STRIPE_SECRET_KEY || "").startsWith("sk_live_");
}

/**
 * Returns the Prisma field name for the active Stripe mode's customer ID column.
 */
function customerIdField(): "stripeLiveCustomerId" | "stripeTestCustomerId" {
  return isLiveMode() ? "stripeLiveCustomerId" : "stripeTestCustomerId";
}

/**
 * Returns the correct Stripe Price ID for the active mode from a product record.
 * Throws a clear error if the price ID for the current mode hasn't been configured.
 */
function getActivePriceId(product: { identifier: string; gatewayTestPriceId: string | null; gatewayLivePriceId: string | null }): string {
  const mode = isLiveMode() ? "live" : "test";
  const priceId = isLiveMode() ? product.gatewayLivePriceId : product.gatewayTestPriceId;
  if (!priceId) {
    throw new Error(
      `Product '${product.identifier}' has no ${mode}-mode price ID configured. ` +
      `Set STRIPE_${mode.toUpperCase()}_PRICE_${product.identifier.toUpperCase()} in your environment and re-run the seed.`
    );
  }
  return priceId;
}

export class PaymentService {
  /**
   * Resolves the gateway customer ID. If missing, registers a new profile with Stripe.
   */
  static async getOrCreateCustomer(userId: string): Promise<string> {
    const field = customerIdField();
    const mode = isLiveMode() ? "live" : "test";

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, stripeLiveCustomerId: true, stripeTestCustomerId: true },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const existingCustomerId = user[field];
    if (existingCustomerId) {
      return existingCustomerId;
    }

    console.log(`[Stripe/${mode}]: Registering customer ${user.email} (${user.name || ""})`);
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
    });

    const newCustomerId = customer.id;

    // Persist the new customer ID into the correct mode-specific column
    await prisma.user.update({
      where: { id: userId },
      data: { [field]: newCustomerId },
    });

    return newCustomerId;
  }

  /**
   * Initiates a Stripe checkout session. Resolves price and product details from the DB.
   */
  static async createCheckoutSession(userId: string, planIdentifier: string): Promise<{ url: string; sessionId: string }> {
    const gatewayCustomerId = await this.getOrCreateCustomer(userId);

    // Fetch the product pricing configuration from the database
    const product = await prisma.product.findUnique({
      where: { identifier: planIdentifier },
    });

    if (!product || !product.isActive) {
      throw new Error(`Product plan '${planIdentifier}' is unavailable or inactive.`);
    }

    const activePriceId = getActivePriceId(product);
    const mode = isLiveMode() ? "live" : "test";

    console.log(`[Stripe/${mode}]: Creating checkout for customer: ${gatewayCustomerId}, price: ${activePriceId}`);
    const session = await stripe.checkout.sessions.create({
      customer: gatewayCustomerId,
      line_items: [{ price: activePriceId, quantity: 1 }],
      mode: "subscription",
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      success_url: env.STRIPE_SUCCESS_URL || `${env.CLIENT_ORIGIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: env.STRIPE_CANCEL_URL || `${env.CLIENT_ORIGIN}/pricing`,
      metadata: { userId, productId: product.id },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new Error("Stripe checkout session creation failed to return a redirect URL.");
    }

    return { url: session.url, sessionId: session.id };
  }

  /**
   * Creates a Stripe customer billing portal session.
   */
  static async createBillingPortalSession(userId: string): Promise<string> {
    const field = customerIdField();
    const mode = isLiveMode() ? "live" : "test";

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeLiveCustomerId: true, stripeTestCustomerId: true },
    });

    const customerId = user?.[field];
    if (!user || !customerId) {
      throw new Error(`No ${mode}-mode billing profile found for this account.`);
    }

    console.log(`[Stripe/${mode}]: Creating billing portal session for customer: ${customerId}`);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.CLIENT_ORIGIN}/profile`,
    });

    return session.url;
  }

  /**
   * Safe parses signatures, handles event audits, and manages subscription lifecycle state.
   */
  static async handleWebhookEvent(rawBody: string | Buffer, signature: string): Promise<any> {
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET || "mock_secret";

    // Verify signatures and extract normalized payloads via Stripe
    console.log("[Stripe]: Verifying Stripe webhook signature");
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    const gatewayEventId = event.id;
    const eventType = event.type;
    const payload = event.data.object;

    // Persistent Idempotency Check: search the WebhookEvent database table
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { gatewayEventId },
    });

    if (existingEvent) {
      console.log(`[PaymentService]: Webhook event '${gatewayEventId}' already processed. Skipping...`);
      return { received: true, eventId: gatewayEventId, status: "duplicate" };
    }

    // Process the action logic using modular event-specific handlers
    switch (eventType) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(payload);
        break;
      case "checkout.session.expired":
        await handleCheckoutSessionExpired(payload);
        break;
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutSessionAsyncPaymentSucceeded(payload);
        break;
      case "checkout.session.async_payment_failed":
        await handleCheckoutSessionAsyncPaymentFailed(payload);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionCreatedOrUpdated(payload);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(payload);
        break;
      case "customer.subscription.trial_will_end":
        await handleSubscriptionTrialWillEnd(payload);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(payload);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(payload);
        break;
      case "invoice.payment_action_required":
        await handleInvoicePaymentActionRequired(payload);
        break;
      case "charge.dispute.created":
        await handleChargeDisputeCreated(payload);
        break;
      default:
        console.log(`[PaymentService]: Unhandled webhook event type '${eventType}'. Ignoring...`);
        break;
    }

    // Save WebhookEvent audit record to prevent duplicates in future retry loops
    await prisma.webhookEvent.create({
      data: {
        gatewayEventId,
        provider: "stripe",
        eventType,
        processed: true,
        payload: payload as any,
      },
    });

    return { received: true, eventId: gatewayEventId, type: eventType, status: "processed" };
  }

  /**
   * Retrieves secure details of a checkout session for the success page.
   * Reads currency/symbol/amount from Stripe session metadata so the frontend
   * never needs to perform any currency conversion or formatting.
   */
  static async getCheckoutSessionDetails(sessionId: string, userId: string): Promise<any> {
    console.log(`[Stripe]: Retrieving checkout session details for session ID: ${sessionId}`);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    if (!session) {
      throw new Error("Billing session not found.");
    }

    // Security check: session metadata must match the authenticated user.
    // Also accepts if the customer ID matches (handles edge cases in webhook timing).
    const metaUserId = session.metadata?.userId;
    if (metaUserId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeLiveCustomerId: true, stripeTestCustomerId: true },
      });
      const customerMatches =
        user && (user.stripeLiveCustomerId === session.customer || user.stripeTestCustomerId === session.customer);
      if (!customerMatches) {
        throw new Error("Access denied. Transaction profile mismatch.");
      }
    }
    // Read currency context from Stripe metadata (set during checkout session creation)
    const meta = session.metadata || {};
    const currency = (session.currency || meta.currency || "nzd").toUpperCase();
    const symbol = meta.symbol || CurrencyFormatter.getSymbol(currency);
    const amountRaw = session.amount_total ?? 0;
    const billing = (meta.billing as "monthly" | "yearly") || "monthly";

    // Format the total paid. Stripe stores zero-decimal currencies (JPY, KRW, etc.)
    // in major units already; everything else is stored in minor units (cents).
    const amountMajor = CurrencyFormatter.isZeroDecimal(currency) ? amountRaw : amountRaw / 100;
    const totalPaidFormatted = meta.amountFormatted || CurrencyFormatter.format(amountMajor, currency);

    // Retrieve active DB subscription (synced by webhooks — may be slightly delayed)
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });

    // Determine billing interval: prefer DB subscription, fall back to Stripe metadata
    const billingInterval =
      subscription?.product?.billingInterval ||
      (billing === "yearly" ? "year" : "month");

    return {
      session: {
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        amountTotal: amountRaw,
        amountMajor,
        currency,
        symbol,
        totalPaidFormatted,
        customerEmail: session.customer_details?.email || null,
        billing,
      },
      // isSubscribed is true if Stripe payment_status is paid (webhook may not have fired yet)
      isSubscribed: session.payment_status === "paid" || !!subscription,
      subscription: {
        id: subscription?.id || session.id,
        status: subscription?.status || (session.payment_status === "paid" ? "ACTIVE" : "PENDING"),
        currentPeriodEnd: subscription?.currentPeriodEnd || null,
        productName: subscription?.product?.name || "Premium Membership",
        priceAmount: amountMajor,
        billingInterval,
      },
    };
  }
}
