/**
 * clear-openings.ts
 * -----------------
 * One-time script: deletes ALL rows from the Opening table.
 *
 * Run with:
 *   cd backend && npx tsx src/scripts/clear-openings.ts
 */

import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Clearing Opening table...");
  const result = await prisma.opening.deleteMany({});
  console.log(`Deleted rows: ${result.count}`);

  const remaining = await prisma.opening.count();
  console.log(`Remaining rows: ${remaining}`);

  if (remaining !== 0) {
    console.error("ERROR: Table is not empty after deleteMany.");
    process.exit(1);
  }
  console.log("[OK] Opening table is now empty.");
}

main()
  .catch((err) => {
    console.error("[FAIL]", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
