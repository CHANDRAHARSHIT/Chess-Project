import { prisma } from "./config/prisma.js";

async function seed() {
  console.log("Seeding subscription products...");

  const stripeKey = process.env.STRIPE_SECRET_KEY || "";
  const isLive = stripeKey.startsWith("sk_live_");
  const mode = isLive ? "live" : "test";

  const monthlyPriceId = process.env.STRIPE_PRICE_PRO_MONTHLY || null;
  const yearlyPriceId = process.env.STRIPE_PRICE_PRO_YEARLY || null;

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

async function seedOpenings() {
  console.log("Seeding chess openings from Lichess dataset...");
  const V1_OPENINGS = [
    "Italian Game",
    "Ruy Lopez",
    "Sicilian Defense",
    "Queen's Gambit",
    "French Defense",
    "Caro-Kann Defense",
    "King's Indian Defense",
    "English Opening",
    "Nimzo-Indian Defense",
    "Scandinavian Defense",
  ];

  const files = ['a.tsv', 'b.tsv', 'c.tsv', 'd.tsv', 'e.tsv'];
  const baseUrl = "https://raw.githubusercontent.com/lichess-org/chess-openings/master/";

  let importedCount = 0;

  const existingOpenings = await prisma.opening.findMany();
  const existingNames = new Set(existingOpenings.map(o => o.name));

  for (const file of files) {
    const response = await fetch(baseUrl + file);
    if (!response.ok) {
      console.error(`Failed to fetch ${file}: ${response.statusText}`);
      continue;
    }
    const text = await response.text();
    const lines = text.split('\n');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [eco, name, pgn] = line.split('\t');

      if (V1_OPENINGS.includes(name)) {
        // Create space-separated move string by stripping out move numbers (e.g. "1. e4 e5" -> "e4 e5")
        const moves = pgn.replace(/\d+\.\s*/g, '').trim();

        if (existingNames.has(name)) {
          // If it exists but we found it again, we just skip it (or we could update the first one)
          // We will update it using findFirst
          const existing = existingOpenings.find(o => o.name === name);
          if (existing) {
            await prisma.opening.update({
              where: { id: existing.id },
              data: { eco, pgn, moves }
            });
            importedCount++;
            // Remove from V1_OPENINGS so we only update the longest/last one
          }
        } else {
          await prisma.opening.create({
            data: {
              name,
              eco,
              pgn,
              moves
            }
          });
          existingNames.add(name);
          existingOpenings.push({ id: '', name, eco, pgn, moves }); // Add placeholder to prevent duplicates
          importedCount++;
        }

        // Remove from list so we only import ONE variation for each of the core openings
        // Actually Lichess TSV has multiple lines with the exact same name (e.g. French Defense).
        // Let's only take the first one we encounter.
        const index = V1_OPENINGS.indexOf(name);
        if (index > -1) {
          V1_OPENINGS.splice(index, 1);
        }
      }
    }
  }

  console.log(`Finished seeding openings. Imported/Updated records: ${importedCount}`);
}

async function main() {
  await seed();
  await seedOpenings();
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
