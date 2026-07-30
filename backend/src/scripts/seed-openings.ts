/**
 * seed-openings.ts
 * ----------------
 * One-time seeder: clears the Opening table and inserts 745 curated
 * main-line openings from frontend/src/data/filtered_openings.json.
 *
 * Run with:
 *   cd backend && npx tsx src/scripts/seed-openings.ts
 *
 * Safety checks:
 *   - Validates the JSON contains exactly 745 entries before any write.
 *   - Logs deleted count, inserted count, and final DB count.
 *   - Stops with a non-zero exit code on any mismatch or error.
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Prisma client — same setup as existing scripts in this project
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Path to the filtered JSON (relative: backend/src/scripts → project root → frontend/src/data)
const JSON_PATH = resolve(
  __dirname,
  "../../../frontend/src/data/filtered_openings.json"
);

const EXPECTED_COUNT = 745;

interface JsonOpening {
  id: string;   // JSON slug-id — NOT inserted (Prisma generates cuid)
  eco: string;
  name: string;
  pgn: string;
  moves: string;
  fen?: string; // Present in JSON but NOT a field in the Opening model — dropped
}

async function main() {
  console.log("=== seed-openings.ts ===\n");

  // ── 1. Read & validate the JSON ──────────────────────────────────────────
  console.log(`Reading: ${JSON_PATH}`);
  const raw = readFileSync(JSON_PATH, "utf-8");
  const jsonData: JsonOpening[] = JSON.parse(raw);

  if (!Array.isArray(jsonData)) {
    console.error("ERROR: JSON file did not parse to an array. Aborting.");
    process.exit(1);
  }

  if (jsonData.length !== EXPECTED_COUNT) {
    console.error(
      `ERROR: Expected ${EXPECTED_COUNT} entries in JSON, found ${jsonData.length}. Aborting without writing.`
    );
    process.exit(1);
  }
  console.log(`Validated: ${jsonData.length} entries in JSON (matches expected ${EXPECTED_COUNT}).\n`);

  // ── 2. Clear the Opening table ───────────────────────────────────────────
  console.log("Step 1/3 — Clearing existing Opening rows...");
  const deleteResult = await prisma.opening.deleteMany({});
  console.log(`  Deleted: ${deleteResult.count} rows.\n`);

  // ── 3. Map JSON → Prisma model fields ────────────────────────────────────
  // Opening model: id (cuid auto), eco, name, pgn, moves
  // We drop: json.id (slug), json.fen (not in schema)
  const records = jsonData.map((o) => ({
    eco: o.eco,
    name: o.name,
    pgn: o.pgn,
    moves: o.moves,
  }));

  // ── 4. Insert via createMany ─────────────────────────────────────────────
  console.log(`Step 2/3 — Inserting ${records.length} openings...`);
  const createResult = await prisma.opening.createMany({ data: records });
  console.log(`  Inserted: ${createResult.count} rows.\n`);

  // ── 5. Verify final count ────────────────────────────────────────────────
  console.log("Step 3/3 — Verifying final row count...");
  const finalCount = await prisma.opening.count();
  console.log(`  Final Opening table count: ${finalCount}`);

  if (finalCount !== EXPECTED_COUNT) {
    console.error(
      `ERROR: Final count ${finalCount} does not match expected ${EXPECTED_COUNT}. Something went wrong.`
    );
    process.exit(1);
  }

  console.log(`\n[OK] Seeding complete. ${finalCount} openings in database.`);
}

main()
  .catch((err) => {
    console.error("\n[FAIL] Seeder failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
