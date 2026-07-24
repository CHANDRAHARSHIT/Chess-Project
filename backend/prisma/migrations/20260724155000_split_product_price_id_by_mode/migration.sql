-- Migration: split_product_price_id_by_mode
--
-- Replaces the single `gatewayPriceId` column on the Product table with two
-- mode-specific columns so Stripe test-mode and live-mode Price IDs can coexist
-- in the same shared database (staging uses test, prod uses live).

-- Step 1: Add the two new columns (nullable — seeded per environment)
ALTER TABLE "Product"
  ADD COLUMN "gatewayTestPriceId" TEXT,
  ADD COLUMN "gatewayLivePriceId" TEXT;

-- Step 2: Migrate existing data into the test column.
-- All currently stored price IDs were created in test mode (before live switch).
UPDATE "Product"
  SET "gatewayTestPriceId" = "gatewayPriceId"
  WHERE "gatewayPriceId" IS NOT NULL;

-- Step 3: Add unique constraints on the new columns
CREATE UNIQUE INDEX "Product_gatewayTestPriceId_key" ON "Product"("gatewayTestPriceId");
CREATE UNIQUE INDEX "Product_gatewayLivePriceId_key"  ON "Product"("gatewayLivePriceId");

-- Step 4: Drop the old column and its unique index
DROP INDEX "Product_gatewayPriceId_key";
ALTER TABLE "Product" DROP COLUMN "gatewayPriceId";
