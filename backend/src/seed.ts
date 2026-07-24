import { prisma } from "./config/prisma.js";

async function seed() {
  console.log("Seeding subscription products...");

  const stripeKey = process.env.STRIPE_SECRET_KEY || "";
  const isLive = stripeKey.startsWith("sk_live_");
  const mode = isLive ? "live" : "test";

  const monthlyPriceId = process.env.STRIPE_PRICE_PRO_MONTHLY || null;
  const yearlyPriceId  = process.env.STRIPE_PRICE_PRO_YEARLY  || null;

  // Write price IDs into the correct mode-specific column only.
  // The other column is left unchanged so both environments accumulate over time.
  const monthlyPriceData = isLive
    ? { gatewayLivePriceId: monthlyPriceId }
    : { gatewayTestPriceId: monthlyPriceId };
  const yearlyPriceData = isLive
    ? { gatewayLivePriceId: yearlyPriceId }
    : { gatewayTestPriceId: yearlyPriceId };

  console.log(`[Seed]: Running in ${mode} mode. Price IDs will be stored in gateway${isLive ? "Live" : "Test"}PriceId.`);

  const features = [
    { featureKey: "unlimited_puzzles", featureValue: "true" },
    { featureKey: "advanced_analysis", featureValue: "true" },
    { featureKey: "cloud_storage", featureValue: "true" },
    { featureKey: "premium_lessons", featureValue: "true" },
    { featureKey: "exclusive_content", featureValue: "true" },
  ];

  // 1. Pro Monthly
  const proMonthly = await prisma.product.upsert({
    where: { identifier: "pro_monthly" },
    update: {
      priceAmount: 864, // 8.64 NZD in cents
      currency: "nzd",
      ...monthlyPriceData,
    },
    create: {
      identifier: "pro_monthly",
      name: "Premium Monthly",
      description: "Access to all premium chess tools billed monthly.",
      priceAmount: 864,
      currency: "nzd",
      billingInterval: "month",
      ...monthlyPriceData,
      isActive: true,
      displayOrder: 1,
    },
  });

  for (const f of features) {
    await prisma.productFeature.upsert({
      where: {
        productId_featureKey: {
          productId: proMonthly.id,
          featureKey: f.featureKey,
        },
      },
      update: { featureValue: f.featureValue },
      create: {
        productId: proMonthly.id,
        featureKey: f.featureKey,
        featureValue: f.featureValue,
      },
    });
  }

  // 2. Pro Yearly
  const proYearly = await prisma.product.upsert({
    where: { identifier: "pro_yearly" },
    update: {
      priceAmount: 3525, // 35.25 NZD in cents
      currency: "nzd",
      ...yearlyPriceData,
    },
    create: {
      identifier: "pro_yearly",
      name: "Premium Yearly",
      description: "Access to all premium chess tools billed yearly.",
      priceAmount: 3525,
      currency: "nzd",
      billingInterval: "year",
      ...yearlyPriceData,
      isActive: true,
      displayOrder: 2,
    },
  });

  for (const f of features) {
    await prisma.productFeature.upsert({
      where: {
        productId_featureKey: {
          productId: proYearly.id,
          featureKey: f.featureKey,
        },
      },
      update: { featureValue: f.featureValue },
      create: {
        productId: proYearly.id,
        featureKey: f.featureKey,
        featureValue: f.featureValue,
      },
    });
  }

  console.log("Seeding completed successfully.");
}

seed()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
