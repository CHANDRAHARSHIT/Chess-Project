import { prisma } from "../../core/database/prisma.js";

export async function handleCheckoutSessionCompleted(payload: any) {
  const customerId = payload.customer;
  const userId = payload.metadata?.userId;
  const productId = payload.metadata?.productId;
  const subscriptionId = payload.subscription;

  if (userId) {
    // Detect mode from customer ID prefix: cus_test_ = test mode, otherwise live mode.
    // Stripe test-mode customer IDs contain "_test_" in the string.
    const field = customerId?.includes("_test_") ? "stripeTestCustomerId" : "stripeLiveCustomerId";
    await prisma.user.update({
      where: { id: userId },
      data: { [field]: customerId },
    });
    console.log(`[CheckoutHandler]: Linked user ${userId} to Stripe customer ${customerId} (${field})`);
  }

  // Double-ensure subscription record is populated/updated
  if (subscriptionId && userId && productId) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product) {
      await prisma.subscription.upsert({
        where: { gatewaySubscriptionId: subscriptionId },
        update: {
          status: "ACTIVE",
        },
        create: {
          userId,
          productId: product.id,
          gatewaySubscriptionId: subscriptionId,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      console.log(`[CheckoutHandler]: Ensured subscription ${subscriptionId} exists for user ${userId}`);
    }
  }
}

export async function handleCheckoutSessionExpired(payload: any) {
  console.log(`[CheckoutHandler]: Checkout session ${payload.id} expired.`);
}

export async function handleCheckoutSessionAsyncPaymentSucceeded(payload: any) {
  const subscriptionId = payload.subscription;
  if (subscriptionId) {
    await prisma.subscription.update({
      where: { gatewaySubscriptionId: subscriptionId },
      data: {
        status: "ACTIVE",
      },
    });
    console.log(`[CheckoutHandler]: Subscription ${subscriptionId} marked ACTIVE (async payment success)`);
  }
}

export async function handleCheckoutSessionAsyncPaymentFailed(payload: any) {
  const subscriptionId = payload.subscription;
  if (subscriptionId) {
    await prisma.subscription.update({
      where: { gatewaySubscriptionId: subscriptionId },
      data: {
        status: "UNPAID",
      },
    });
    console.log(`[CheckoutHandler]: Subscription ${subscriptionId} marked UNPAID (async payment failure)`);
  }
}
