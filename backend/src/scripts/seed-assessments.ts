/**
 * seed-assessments.ts
 * --------------------
 * One-time seeder: creates version-1 AssessmentTemplate rows for the
 * "backend", "manager", and "growth-marketing" Join Us tracks from the
 * JSON files in prisma/seed-data/.
 *
 * Safe to re-run — if a template for (trackSlug, version 1) already
 * exists it is updated in place rather than duplicated.
 *
 * Run with:
 *   npx tsx src/scripts/seed-assessments.ts
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
const SEED_DATA_DIR = resolve(__dirname, "../../prisma/seed-data");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function loadJson(filename: string) {
  return JSON.parse(readFileSync(resolve(SEED_DATA_DIR, filename), "utf-8"));
}

async function upsertTemplate(trackSlug: string, data: unknown, gradingRules: unknown | null) {
  const existing = await prisma.assessmentTemplate.findUnique({
    where: { trackSlug_version: { trackSlug, version: 1 } },
  });

  if (existing) {
    await prisma.assessmentTemplate.update({
      where: { id: existing.id },
      data: { data: data as object, gradingRules: gradingRules as object | undefined, isActive: true },
    });
    console.log(`Updated template: ${trackSlug} v1 (${existing.id})`);
  } else {
    const created = await prisma.assessmentTemplate.create({
      data: {
        trackSlug,
        version: 1,
        isActive: true,
        data: data as object,
        gradingRules: gradingRules as object | undefined,
      },
    });
    console.log(`Created template: ${trackSlug} v1 (${created.id})`);
  }
}

async function main() {
  const backendData = loadJson("backend-track.json");
  const backendGradingRules = loadJson("backend-grading-rules.json");
  await upsertTemplate("backend", backendData, backendGradingRules);

  const managerData = loadJson("manager-track.json");
  await upsertTemplate("manager", managerData, null);

  const growthData = loadJson("growth-track.json");
  const growthGradingRules = loadJson("growth-grading-rules.json");
  await upsertTemplate("growth-marketing", growthData, growthGradingRules);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
