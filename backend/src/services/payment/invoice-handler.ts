import { prisma } from "../../config/prisma.js";

export async function handleInvoicePaymentSucceeded(payload: any) {
  const customerId = payload.customer;
  const subscriptionId = payload.subscription;
  const amountPaid = payload.amount_paid || 0;
  const currency = payload.currency || "nzd";
  const paymentIntentId = payload.payment_intent;
  const invoiceId = payload.id;
  const chargeId = payload.charge;

  // Locate user — check both test and live Stripe customer ID columns
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { stripeLiveCustomerId: customerId },
        { stripeTestCustomerId: customerId },
      ],
    },
  });

  if (!user) {
    console.error(`[InvoiceHandler]: User with customer ID ${customerId} not found.`);
    return;
  }

  // Locate subscription
  let subscription = subscriptionId
    ? await prisma.subscription.findUnique({ where: { gatewaySubscriptionId: subscriptionId } })
    : null;

  if (!subscription && subscriptionId) {
    const priceId = payload.lines?.data[0]?.price?.id;
    if (priceId) {
      const product = await prisma.product.findFirst({ where: { OR: [{ gatewayLivePriceId: priceId }, { gatewayTestPriceId: priceId }] } });
      if (product) {
        subscription = await prisma.subscription.create({
          data: {
            userId: user.id,
            productId: product.id,
            gatewaySubscriptionId: subscriptionId,
            status: "ACTIVE",
            currentPeriodStart: new Date((payload.lines?.data[0]?.period?.start || Date.now() / 1000) * 1000),
            currentPeriodEnd: new Date((payload.lines?.data[0]?.period?.end || (Date.now() / 1000) + 30 * 24 * 3600) * 1000),
          },
        });
      }
    }
  } else if (subscription) {
    const periodStart = payload.lines?.data[0]?.period?.start;
    const periodEnd = payload.lines?.data[0]?.period?.end;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "ACTIVE",
        currentPeriodStart: periodStart ? new Date(periodStart * 1000) : undefined,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
      },
    });
  }

  // Create payment audit record
  await prisma.payment.create({
    data: {
      userId: user.id,
      subscriptionId: subscription?.id || null,
      amount: amountPaid,
      currency,
      status: "SUCCEEDED",
      paymentMethod: "card",
      gatewayPaymentIntentId: paymentIntentId,
      gatewayInvoiceId: invoiceId,
      provider: "stripe",
      gatewayCustomerId: customerId,
      gatewayMetadata: {
        chargeId,
        hostedInvoiceUrl: payload.hosted_invoice_url,
      },
    },
  });

  console.log(`[InvoiceHandler]: Logged invoice.payment_succeeded for invoice ID ${invoiceId}`);
}

export async function handleInvoicePaymentFailed(payload: any) {
  const customerId = payload.customer;
  const subscriptionId = payload.subscription;
  const amountDue = payload.amount_due || payload.amount_remaining || 0;
  const currency = payload.currency || "nzd";
  const paymentIntentId = payload.payment_intent;
  const invoiceId = payload.id;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { stripeLiveCustomerId: customerId },
        { stripeTestCustomerId: customerId },
      ],
    },
  });

  if (!user) {
    console.error(`[InvoiceHandler]: User with customer ID ${customerId} not found.`);
    return;
  }

  const subscription = subscriptionId
    ? await prisma.subscription.findUnique({ where: { gatewaySubscriptionId: subscriptionId } })
    : null;

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "PAST_DUE",
      },
    });
  }

  // Create payment record marked as FAILED
  await prisma.payment.create({
    data: {
      userId: user.id,
      subscriptionId: subscription?.id || null,
      amount: amountDue,
      currency,
      status: "FAILED",
      paymentMethod: "card",
      gatewayPaymentIntentId: paymentIntentId,
      gatewayInvoiceId: invoiceId,
      provider: "stripe",
      gatewayCustomerId: customerId,
      errorMessage: "Stripe invoice payment failed or was declined.",
    },
  });

  console.log(`[InvoiceHandler]: Logged invoice.payment_failed for invoice ID ${invoiceId}`);
}

export async function handleInvoicePaymentActionRequired(payload: any) {
  const subscriptionId = payload.subscription;
  if (subscriptionId) {
    await prisma.subscription.update({
      where: { gatewaySubscriptionId: subscriptionId },
      data: {
        status: "PAST_DUE",
      },
    });
    console.log(`[InvoiceHandler]: Subscription ${subscriptionId} marked PAST_DUE (requires 3DS action)`);
  }
}
