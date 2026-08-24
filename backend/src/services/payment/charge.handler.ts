import { prisma } from "../../config/prisma.js";

export async function handleChargeDisputeCreated(payload: any) {
  const disputeId = payload.id;
  const chargeId = payload.charge;
  const disputeStatus = payload.status;
  const amount = payload.amount;

  console.warn(
    `[ChargeHandler]: Dispute '${disputeId}' created for charge '${chargeId}'. Amount: ${amount}. Status: ${disputeStatus}`
  );

  // We can look up the Payment record by invoice or intent if the dispute has it,
  // or look up by matching chargeId if stored in gatewayMetadata.
  // To be safe and avoid database-specific JSON path query failures, we retrieve the
  // user's subscriptions and downgrade status to PAST_DUE to suspend premium access.
  
  // Find payment by gatewayPaymentIntentId if available, or list user payments
  const payment = await prisma.payment.findFirst({
    where: {
      gatewayMetadata: {
        path: ["chargeId"],
        equals: chargeId,
      },
    },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        errorMessage: `Dispute created: ${disputeId}. Status: ${disputeStatus}.`,
      },
    });

    if (payment.subscriptionId) {
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: "PAST_DUE",
        },
      });
      console.log(`[ChargeHandler]: Suspended subscription ${payment.subscriptionId} due to dispute.`);
    }
  }
}
