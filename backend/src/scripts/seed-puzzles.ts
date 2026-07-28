/**
 * seed-puzzles.ts
 * ---------------
 * One-time seeder: parses puzzles_curated.csv and upserts all rows
 * into the CuratedPuzzle table in Supabase via Prisma.
 *
 * Run with:
 *   npx tsx src/scripts/seed-puzzles.ts
 *
 * Safe to re-run — uses createMany with skipDuplicates.
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

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// CSV is at the project root (two levels up from backend/src/scripts/)
const CSV_PATH = resolve(__dirname, "../../../puzzles_curated.csv");

interface RawRow {
  PuzzleId: string;
  FEN: string;
  Moves: string;
  Rating: string;
  RatingDeviation: string;
  Popularity: string;
  NbPlays: string;
  Themes: string;
}

/**
 * Minimal, dependency-free CSV parser.
 * Handles the Lichess export format (no quoted commas in this dataset).
 */
function parseCsv(content: string): RawRow[] {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (values[i] ?? "").trim();
    });
    return row as unknown as RawRow;
  });
}

async function main() {
  console.log(`📂 Reading CSV from: ${CSV_PATH}`);
  const csvContent = readFileSync(CSV_PATH, "utf-8");
  const rows = parseCsv(csvContent);
  console.log(`📋 Parsed ${rows.length} rows`);

  const puzzles = rows
    .filter((row) => row.PuzzleId && row.FEN && row.Moves)
    .map((row) => ({
      id: row.PuzzleId,
      fen: row.FEN,
      moves: row.Moves,
      rating: parseInt(row.Rating, 10) || 0,
      ratingDeviation: parseInt(row.RatingDeviation, 10) || 0,
      popularity: parseInt(row.Popularity, 10) || 0,
      nbPlays: parseInt(row.NbPlays, 10) || 0,
      // Themes column: space-separated string → string[]
      themes: row.Themes
        ? row.Themes.split(" ").filter(Boolean)
        : [],
    }));

  console.log(`🧩 Seeding ${puzzles.length} puzzles…`);

  const result = await prisma.curatedPuzzle.createMany({
    data: puzzles,
    skipDuplicates: true,
  });

  console.log(`✅ Done! Inserted ${result.count} new puzzles.`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
