/**
 * fetch-openings.mjs
 *
 * Downloads ECO A-E TSV files from the Lichess GitHub repository,
 * parses and filters them down to ~1000 well-known main-line openings,
 * and writes the result to:
 *   frontend/src/data/filtered_openings.json
 *
 * Run from the project root:
 *   node data-scripts/fetch-openings.mjs
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Config ──────────────────────────────────────────────────────────────────

const TSV_URLS = [
  "https://raw.githubusercontent.com/lichess-org/chess-openings/master/a.tsv",
  "https://raw.githubusercontent.com/lichess-org/chess-openings/master/b.tsv",
  "https://raw.githubusercontent.com/lichess-org/chess-openings/master/c.tsv",
  "https://raw.githubusercontent.com/lichess-org/chess-openings/master/d.tsv",
  "https://raw.githubusercontent.com/lichess-org/chess-openings/master/e.tsv",
];

const OUTPUT_PATH = join(
  __dirname,
  "..",
  "frontend",
  "src",
  "data",
  "filtered_openings.json"
);

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchTSV(url) {
  console.log(`  Fetching ${url} ...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// ─── Parse ────────────────────────────────────────────────────────────────────

/** Lichess TSV format: eco\tname\tpgn (3 columns, header on first row) */
function parseTSV(text) {
  const results = [];
  const lines = text.trim().split("\n");
  for (const line of lines.slice(1)) {
    const parts = line.split("\t");
    if (parts.length < 3) continue;
    const [eco, name, pgn] = parts;
    if (!eco || !name || !pgn) continue;
    results.push({ eco: eco.trim(), name: name.trim(), pgn: pgn.trim() });
  }
  return results;
}

// ─── Half-move count helper ───────────────────────────────────────────────────

function halfMoveCount(pgn) {
  return pgn
    .replace(/\d+\./g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

// ─── Main filtering ───────────────────────────────────────────────────────────

/**
 * Filtering strategy (cascading):
 *
 * Pass 1 — Hard drops (regardless of final count):
 *   - More than 1 colon in name (deep sub-variations)
 *   - Parenthetical sub-names "(…)"
 *   - ECO letter-suffix codes (A00a) when the plain base (A00) exists
 *
 * Pass 2 — Move-depth cap:
 *   - Keep only openings with <= MAX_HALF_MOVES half-moves
 *   - This is tuned until we land at or below TARGET_COUNT
 *
 * Pass 3 — Per-ECO dedup:
 *   - For each plain ECO code, keep at most MAX_PER_ECO variations
 *   - Sort by name length (shorter = more fundamental) and take the first N
 */
function filterOpenings(rows) {
  const TARGET_COUNT = 1000;
  const MAX_HALF_MOVES = 8; // 4 full moves — captures all major named systems
  const MAX_PER_ECO = 5;    // e.g. A45: Queen's Pawn + 4 of its main variations

  // ── Pass 1: Hard drops ────────────────────────────────────────────────────
  const plainEcos = new Set(
    rows.filter((r) => !/[a-z]$/.test(r.eco)).map((r) => r.eco)
  );

  let keep = rows.filter((row) => {
    // Drop deep sub-variations
    const colonCount = (row.name.match(/:/g) || []).length;
    if (colonCount > 1) return false;

    // Drop parenthetical
    if (/\(/.test(row.name)) return false;

    // Drop ECO letter sub-codes when plain version exists
    if (/[a-z]$/.test(row.eco)) {
      const base = row.eco.replace(/[a-z]+$/, "");
      if (plainEcos.has(base)) return false;
    }

    return true;
  });

  console.log(`  After Pass 1 (hard drops)    : ${keep.length}`);

  // ── Pass 2: Move-depth cap ────────────────────────────────────────────────
  keep = keep.filter((row) => halfMoveCount(row.pgn) <= MAX_HALF_MOVES);
  console.log(`  After Pass 2 (depth <= ${MAX_HALF_MOVES} hm)  : ${keep.length}`);

  // ── Pass 3: Per-ECO cap ───────────────────────────────────────────────────
  const byEco = new Map();
  for (const row of keep) {
    const base = row.eco.replace(/[a-z]+$/, "");
    if (!byEco.has(base)) byEco.set(base, []);
    byEco.get(base).push(row);
  }

  // Sort each group: shortest name first (most fundamental), then trim
  const final = [];
  for (const [, group] of byEco) {
    group.sort((a, b) => a.name.length - b.name.length);
    final.push(...group.slice(0, MAX_PER_ECO));
  }

  console.log(`  After Pass 3 (max ${MAX_PER_ECO} per ECO)    : ${final.length}`);

  // If we're still above target, apply a stricter depth cap pass
  let result = final;
  if (result.length > TARGET_COUNT) {
    result = result.filter((row) => halfMoveCount(row.pgn) <= 6);
    console.log(`  After extra depth cap (<=6 hm): ${result.length}`);
  }

  return result;
}

// ─── Transform ────────────────────────────────────────────────────────────────

function toOpening(row, index) {
  const slug = `${row.eco.toLowerCase()}-${row.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

  const moves = row.pgn
    .replace(/\d+\./g, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    id: slug || `opening-${index}`,
    eco: row.eco,
    name: row.name,
    pgn: row.pgn,
    moves,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("============================================");
  console.log("  Lichess Opening Dataset Builder          ");
  console.log("============================================\n");

  console.log("Step 1/4 -- Fetching TSV files from Lichess GitHub...");
  const texts = await Promise.all(TSV_URLS.map(fetchTSV));

  console.log("\nStep 2/4 -- Parsing and combining all files...");
  const allRows = texts.flatMap(parseTSV);
  console.log(`  Total raw rows : ${allRows.length}`);

  console.log("\nStep 3/4 -- Filtering to main lines...");
  const filtered = filterOpenings(allRows);

  console.log("\nStep 4/4 -- Writing filtered_openings.json...");
  const openings = filtered.map(toOpening);

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(openings, null, 2), "utf8");

  console.log(`\n[OK]  Saved ${openings.length} openings to:`);
  console.log(`   ${OUTPUT_PATH}\n`);

  console.log("Sample entries:");
  openings.slice(0, 8).forEach((o, i) => {
    console.log(`  [${i + 1}] ${o.eco}  ${o.name}`);
  });
  if (openings.length > 8) {
    console.log(`  ... (${openings.length - 8} more)`);
  }
}

main().catch((err) => {
  console.error("\n[FAIL] Script failed:", err.message);
  process.exit(1);
});
