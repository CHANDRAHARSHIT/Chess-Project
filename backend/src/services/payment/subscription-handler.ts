import { prisma } from "../../core/database/prisma.js";
import { SubscriptionStatus } from "../../generated/prisma/enums.js";
import rollbar from "../../core/config/rollbar.config.js";

export function normalizeSubscriptionStatus(status: string): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "unpaid":
      return "UNPAID";
    case "incomplete":
      return "INCOMPLETE";
    case "incomplete_expired":
      return "INCOMPLETE_EXPIRED";
    default:
      return "CANCELED";
  }
}

export async function handleSubscriptionCreatedOrUpdated(payload: any) {
  const gatewaySubscriptionId = payload.id;
  const customerId = payload.customer;
  const status = normalizeSubscriptionStatus(payload.status);
  const currentPeriodStart = new Date(payload.current_period_start * 1000);
  const currentPeriodEnd = new Date(payload.current_period_end * 1000);
  const cancelAtPeriodEnd = payload.cancel_at_period_end || false;
  const canceledAt = payload.canceled_at ? new Date(payload.canceled_at * 1000) : null;
  const endedAt = payload.ended_at ? new Date(payload.ended_at * 1000) : null;
  const trialStart = payload.trial_start ? new Date(payload.trial_start * 1000) : null;
  const trialEnd = payload.trial_end ? new Date(payload.trial_end * 1000) : null;
  
  // Find user by Stripe customer ID — check both test and live columns
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { stripeLiveCustomerId: customerId },
        { stripeTestCustomerId: customerId },
      ],
    },
  });

  if (!user) {
    const message = `[SubscriptionHandler]: User with customer ID ${customerId} not found.`;
    console.error(message);
    // No throw here (webhook must still 200 back to Stripe), so report manually —
    // this indicates a customer/user linkage gap that needs investigation.
    rollbar.error(message, { customerId, gatewaySubscriptionId });
    return;
  }

  // Find product by gatewayPriceId (Stripe Price ID)
  const priceId = payload.items?.data[0]?.price?.id;
  if (!priceId) {
    const message = "[SubscriptionHandler]: No price ID found in subscription payload.";
    console.error(message);
    rollbar.error(message, { gatewaySubscriptionId, customerId });
    return;
  }

  // Find product by Stripe Price ID — check both test and live columns
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { gatewayLivePriceId: priceId },
        { gatewayTestPriceId: priceId },
      ],
    },
  });

  if (!product) {
    const message = `[SubscriptionHandler]: Product with gatewayPriceId ${priceId} not found.`;
    console.error(message);
    rollbar.error(message, { priceId, gatewaySubscriptionId, customerId });
    return;
  }

  // Upsert subscription
  await prisma.subscription.upsert({
    where: { gatewaySubscriptionId },
    update: {
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      canceledAt,
      endedAt,
      trialStart,
      trialEnd,
    },
    create: {
      userId: user.id,
      productId: product.id,
      gatewaySubscriptionId,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      canceledAt,
      endedAt,
      trialStart,
      trialEnd,
    },
  });

  console.log(`[SubscriptionHandler]: Subscription ${gatewaySubscriptionId} updated/created for user ${user.id}`);
}

export async function handleSubscriptionDeleted(payload: any) {
  const gatewaySubscriptionId = payload.id;
  const endedAt = payload.ended_at ? new Date(payload.ended_at * 1000) : new Date();

  await prisma.subscription.update({
    where: { gatewaySubscriptionId },
    data: {
      status: "CANCELED",
      endedAt,
    },
  });

  console.log(`[SubscriptionHandler]: Subscription ${gatewaySubscriptionId} marked as CANCELED`);
}

export async function handleSubscriptionTrialWillEnd(payload: any) {
  const gatewaySubscriptionId = payload.id;
  console.log(`[SubscriptionHandler]: Trial will end soon for subscription ${gatewaySubscriptionId}`);
}
