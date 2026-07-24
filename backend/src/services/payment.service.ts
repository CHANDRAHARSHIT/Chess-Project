import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import Stripe from "stripe";
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

export class PaymentService {
  /**
   * Resolves the gateway customer ID. If missing, registers a new profile with Stripe.
   */
  static async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, gatewayCustomerId: true },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    if (user.gatewayCustomerId) {
      return user.gatewayCustomerId;
    }

    console.log(`[Stripe]: Registering customer ${user.email} (${user.name || ""})`);
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
    });

    const gatewayCustomerId = customer.id;

    // Save ID to database
    await prisma.user.update({
      where: { id: userId },
      data: { gatewayCustomerId },
    });

    return gatewayCustomerId;
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

    console.log(`[Stripe]: Creating checkout for customer: ${gatewayCustomerId}, price: ${product.gatewayPriceId}`);
    const session = await stripe.checkout.sessions.create({
      customer: gatewayCustomerId,
      line_items: [{ price: product.gatewayPriceId, quantity: 1 }],
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { gatewayCustomerId: true },
    });

    if (!user || !user.gatewayCustomerId) {
      throw new Error("No billing profile customer ID found for this account.");
    }

    console.log(`[Stripe]: Creating billing portal session for customer: ${user.gatewayCustomerId}`);
    const session = await stripe.billingPortal.sessions.create({
      customer: user.gatewayCustomerId,
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
   * Retrieves secure details of a checkout session for verification.
   */
  static async getCheckoutSessionDetails(sessionId: string, userId: string): Promise<any> {
    console.log(`[Stripe]: Retrieving checkout session details for session ID: ${sessionId}`);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      throw new Error("Billing session not found.");
    }

    // Security check: ensure metadata belongs to the authenticated user
    if (session.metadata?.userId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { gatewayCustomerId: true },
      });
      if (!user || user.gatewayCustomerId !== session.customer) {
        throw new Error("Access denied. Transaction profile mismatch.");
      }
    }

    // Retrieve active subscription from the database (synced by webhooks)
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
      include: {
        product: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      session: {
        id: session.id,
        paymentStatus: session.payment_status,
        status: session.status,
        amountTotal: session.amount_total,
        currency: session.currency,
        customerEmail: session.customer_details?.email || null,
      },
      isSubscribed: !!subscription,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        productName: subscription.product.name,
        priceAmount: subscription.product.priceAmount,
        billingInterval: subscription.product.billingInterval,
      } : null,
    };
  }
}
