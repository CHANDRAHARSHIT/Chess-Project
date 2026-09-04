/**
 * importThemedPuzzles.ts
 * ------------------------
 * Task 2: extend the Odyssey puzzle collection with tactical/positional
 * themes beyond forced mates, sourced from Lichess's own public puzzle
 * database (lichess_db_puzzle.csv — CC0, ~6.1M puzzles, each already
 * Stockfish-analyzed and theme-tagged by Lichess itself).
 *
 * Lichess puzzle format quirk: FEN is the position BEFORE the opponent's
 * setup move, and Moves[0] is that setup move. We apply it to get the real
 * puzzle position (fen) and store Moves.slice(1) as the solver's solution —
 * matching the convention generateMatePuzzles.ts already established.
 *
 * Run with: npx tsx src/scripts/importThemedPuzzles.ts
 */
import "dotenv/config";
import fs from "fs";
import readline from "readline";
import { Chess } from "chess.js";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const CSV_PATH = "data/lichess_db_puzzle.csv";
const TARGET_PER_CATEGORY = 100;
const SOURCE = "lichess_db_puzzle";

const TACTICAL_MOTIFS = [
  "fork", "pin", "skewer", "discoveredAttack", "sacrifice", "hangingPiece",
  "trappedPiece", "deflection", "attraction", "clearance", "interference",
  "intermezzo", "xRayAttack", "doubleCheck", "discoveredCheck", "capturingDefender",
];

interface Category {
  name: string;
  /** Row must have this Lichess theme tag. */
  requiresTheme?: string;
  /** Row must have "endgame" plus any of TACTICAL_MOTIFS. */
  endgameTactics?: boolean;
  /** Row must have "sacrifice" AND the solver's first move must move a queen. */
  queenSacrifice?: boolean;
}

const CATEGORIES: Category[] = [
  { name: "fork", requiresTheme: "fork" },
  { name: "sacrifice", requiresTheme: "sacrifice" },
  { name: "pin", requiresTheme: "pin" },
  { name: "discoveredAttack", requiresTheme: "discoveredAttack" },
  { name: "pawnEndgame", requiresTheme: "pawnEndgame" },
  { name: "hangingPiece", requiresTheme: "hangingPiece" },
  { name: "backRankMate", requiresTheme: "backRankMate" },
  { name: "promotion", requiresTheme: "promotion" },
  { name: "skewer", requiresTheme: "skewer" },
  { name: "trappedPiece", requiresTheme: "trappedPiece" },
  { name: "underPromotion", requiresTheme: "underPromotion" },
  { name: "queenSacrifice", queenSacrifice: true },
  { name: "endgameTactics", endgameTactics: true },
];

function matchesCategory(cat: Category, themeSet: Set<string>): boolean {
  if (cat.requiresTheme) return themeSet.has(cat.requiresTheme);
  if (cat.endgameTactics) {
    return themeSet.has("endgame") && TACTICAL_MOTIFS.some((t) => themeSet.has(t));
  }
  if (cat.queenSacrifice) return themeSet.has("sacrifice");
  return false;
}

async function main() {
  const counts = new Map<string, number>();
  for (const cat of CATEGORIES) counts.set(cat.name, 0);

  // Seed with what's already in the DB (backRankMate=81 from the mate backfill).
  for (const cat of CATEGORIES) {
    counts.set(
      cat.name,
      await prisma.odysseyPuzzleTheme.count({ where: { theme: cat.name } })
    );
  }
  console.log("Starting counts:", Object.fromEntries(counts));

  const seenFens = new Set<string>(
    (await prisma.odysseyPuzzle.findMany({ select: { fen: true } })).map((p) => p.fen)
  );

  const rl = readline.createInterface({
    input: fs.createReadStream(CSV_PATH),
    crlfDelay: Infinity,
  });

  let first = true;
  let rowsScanned = 0;

  const allFull = () => [...counts.values()].every((c) => c >= TARGET_PER_CATEGORY);

  for await (const line of rl) {
    if (first) {
      first = false;
      continue;
    }
    if (allFull()) break;
    if (!line) continue;
    rowsScanned++;

    const parts = line.split(",");
    const [, fen, movesStr, ratingStr, , , , themesStr] = parts;
    if (!fen || !movesStr || !themesStr) continue;

    const themeSet = new Set(themesStr.split(" ").filter(Boolean));
    const candidateCategories = CATEGORIES.filter(
      (cat) => (counts.get(cat.name) ?? 0) < TARGET_PER_CATEGORY && matchesCategory(cat, themeSet)
    );
    if (candidateCategories.length === 0) continue;

    // Transform Lichess format -> our format (see header comment).
    const moves = movesStr.split(" ");
    if (moves.length < 2) continue;

    const chess = new Chess(fen);
    let setupOk = true;
    try {
      chess.move({ from: moves[0].slice(0, 2), to: moves[0].slice(2, 4), promotion: moves[0].slice(4) || undefined });
    } catch {
      setupOk = false;
    }
    if (!setupOk) continue;

    const puzzleFen = chess.fen();
    if (seenFens.has(puzzleFen)) continue;

    const solution = moves.slice(1);

    // Verify: replay the full solution and (for mate puzzles) confirm real checkmate.
    let replayOk = true;
    for (const uci of solution) {
      try {
        chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4) || undefined });
      } catch {
        replayOk = false;
        break;
      }
    }
    if (!replayOk) continue;
    if (themeSet.has("mate") && !chess.isCheckmate()) continue;

    // Queen Sacrifice: solver's first move (solution[0]) must move a queen.
    const finalCategories = candidateCategories.filter((cat) => {
      if (!cat.queenSacrifice) return true;
      const replay = new Chess(puzzleFen);
      const piece = replay.get(solution[0].slice(0, 2) as import("chess.js").Square);
      return piece?.type === "q";
    });
    if (finalCategories.length === 0) continue;

    seenFens.add(puzzleFen);

    const mateIn = themeSet.has("mate") ? Math.ceil(solution.length / 2) : null;
    const rating = Number(ratingStr) || 1000;

    let created;
    try {
      created = await prisma.odysseyPuzzle.create({
        data: {
          fen: puzzleFen,
          solution,
          puzzleRatingDifficulty: rating,
          type: mateIn ? "FIND_MATE" : "BEST_MOVE",
          mateIn,
          source: SOURCE,
        },
      });
    } catch (err) {
      console.warn(`Insert failed for ${puzzleFen}: ${(err as Error).message}`);
      continue;
    }

    for (const cat of finalCategories) {
      if ((counts.get(cat.name) ?? 0) >= TARGET_PER_CATEGORY) continue;
      await prisma.odysseyPuzzleTheme.create({
        data: { puzzleId: created.id, theme: cat.name },
      });
      counts.set(cat.name, (counts.get(cat.name) ?? 0) + 1);
    }
    // Also tag with every Lichess theme this puzzle actually carries among
    // our tracked categories, plus mate-length, for future filtering reuse.
    if (mateIn) {
      const mateTheme = `mateIn${mateIn}`;
      await prisma.odysseyPuzzleTheme
        .create({ data: { puzzleId: created.id, theme: mateTheme } })
        .catch(() => {});
    }

    if (rowsScanned % 200_000 === 0) {
      console.log(`...scanned ${rowsScanned} rows`, Object.fromEntries(counts));
    }
  }

  console.log(`\nDone. Scanned ${rowsScanned} rows.`);
  console.log("Final counts:", Object.fromEntries(counts));

  const short = CATEGORIES.filter((c) => (counts.get(c.name) ?? 0) < TARGET_PER_CATEGORY);
  if (short.length > 0) {
    console.warn(
      "Short on:",
      short.map((c) => `${c.name}=${counts.get(c.name)}`).join(", ")
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
