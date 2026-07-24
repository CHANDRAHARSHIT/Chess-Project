-- Migration: split_stripe_customer_id_by_mode
--
-- Replaces the single `gatewayCustomerId` column on the User table with two
-- separate mode-specific columns so Stripe test-mode and live-mode customer IDs
-- can coexist in the same shared database without conflicting.

-- Step 1: Add the two new mode-specific columns
ALTER TABLE "User"
  ADD COLUMN "stripeTestCustomerId" TEXT,
  ADD COLUMN "stripeLiveCustomerId" TEXT;

-- Step 2: Copy any existing test-mode IDs (cus_test_ prefix) into the test column
--         and everything else (live IDs) into the live column.
--         Safe to run even if gatewayCustomerId is NULL on all rows.
UPDATE "User"
  SET "stripeTestCustomerId" = "gatewayCustomerId"
  WHERE "gatewayCustomerId" LIKE '%_test_%';

UPDATE "User"
  SET "stripeLiveCustomerId" = "gatewayCustomerId"
  WHERE "gatewayCustomerId" IS NOT NULL
    AND "gatewayCustomerId" NOT LIKE '%_test_%';

-- Step 3: Add unique constraints on the new columns
CREATE UNIQUE INDEX "User_stripeTestCustomerId_key" ON "User"("stripeTestCustomerId");
CREATE UNIQUE INDEX "User_stripeLiveCustomerId_key"  ON "User"("stripeLiveCustomerId");

-- Step 4: Drop the old column and its unique index
DROP INDEX "User_gatewayCustomerId_key";
ALTER TABLE "User" DROP COLUMN "gatewayCustomerId";
