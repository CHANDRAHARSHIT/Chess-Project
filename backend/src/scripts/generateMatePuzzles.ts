/**
 * generateMatePuzzles.ts
 * -----------------------
 * One-off, manually-run script (Backend Task — Initial Puzzle Collection, Goal 1
 * only). Generates 100 Stockfish-CONFIRMED forced-mate puzzles for each of
 * mate-in-1 through mate-in-5 (500 total) from real games and inserts them into
 * the `odyssey_puzzles` table.
 *
 * Pipeline: load PGN games -> keep games that actually ended in checkmate ->
 * for each, derive up to 5 candidate FENs (one per hypothetical mate length,
 * counted in the mating side's own moves) -> verify each with Stockfish,
 * trusting ONLY Stockfish's own reported mate length (never the assumed one)
 * -> dedupe by FEN -> insert into whichever bucket (1-5) actually matches,
 * stopping each bucket once it reaches 100.
 *
 * Run with:
 *   npx tsx src/scripts/generateMatePuzzles.ts
 *
 * Source data: backend/data/lichess_2013-01.pgn (gitignored; see
 * README note in that directory / the task description for how to re-fetch).
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { Chess } from "chess.js";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { StockfishEngine } from "../anticheat/detection/engine/StockfishEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PGN_PATH = process.env.PUZZLE_PGN_PATH
  ? resolve(process.env.PUZZLE_PGN_PATH)
  : resolve(__dirname, "../../data/lichess_2013-01.pgn");
const SOURCE = "lichess_2013-01";
const PUZZLES_PER_BUCKET = process.env.PUZZLE_TARGET_PER_BUCKET
  ? Number(process.env.PUZZLE_TARGET_PER_BUCKET)
  : 100;
const MAX_MATE_IN = 5;
const RATING_DIFFICULTY = 1000;
const SEARCH_DEPTH = 18;

const engine = new StockfishEngine();

interface Bucket {
  mateIn: number;
  count: number;
}

async function main() {
  console.log(`Reading PGN from: ${PGN_PATH}`);
  const pgnText = readFileSync(PGN_PATH, "utf-8");
  const games = splitGames(pgnText);
  console.log(`Found ${games.length} games in the dump.`);

  const buckets = new Map<number, Bucket>();
  for (let k = 1; k <= MAX_MATE_IN; k++) buckets.set(k, { mateIn: k, count: 0 });

  // Seed existing counts, so a re-run picks up where a previous run left off.
  for (const bucket of buckets.values()) {
    bucket.count = await prisma.odysseyPuzzle.count({
      where: { type: "FIND_MATE", mateIn: bucket.mateIn },
    });
  }
  logProgress(buckets);

  const seenFens = new Set<string>(
    (await prisma.odysseyPuzzle.findMany({ select: { fen: true } })).map((p) => p.fen)
  );

  let gamesScanned = 0;
  let candidatesEvaluated = 0;

  for (const gameText of games) {
    gamesScanned++;
    if (allBucketsFull(buckets)) break;

    const candidates = extractCandidates(gameText);
    if (!candidates) continue;

    for (const { fen } of candidates) {
      if (allBucketsFull(buckets)) break;
      if (seenFens.has(fen)) continue;

      // Skip candidate mate lengths whose bucket is already full — Stockfish
      // might still report a different length, but there is no point spending
      // an evaluation on a length we no longer need if we already know we
      // need fewer buckets. We still check every k because Stockfish's actual
      // answer can land in any bucket, not just the one this candidate targets.

      seenFens.add(fen);
      candidatesEvaluated++;

      let result;
      try {
        result = await engine.evaluate(fen, false, SEARCH_DEPTH);
      } catch (err) {
        console.warn(`Stockfish eval failed for ${fen}: ${(err as Error).message}`);
        continue;
      }

      if (!result.mateIn || result.mateIn <= 0) continue;
      const mateIn = result.mateIn;
      if (mateIn < 1 || mateIn > MAX_MATE_IN) continue;

      const bucket = buckets.get(mateIn)!;
      if (bucket.count >= PUZZLES_PER_BUCKET) continue;

      const requiredPlies = mateIn * 2 - 1;
      if (!result.pv || result.pv.length < requiredPlies) {
        console.warn(`Mate in ${mateIn} reported but pv too short for ${fen}; skipping.`);
        continue;
      }
      const solution = result.pv.slice(0, requiredPlies);

      try {
        await prisma.odysseyPuzzle.create({
          data: {
            fen,
            solution,
            puzzleRatingDifficulty: RATING_DIFFICULTY,
            type: "FIND_MATE",
            mateIn,
            source: SOURCE,
          },
        });
        bucket.count++;
        console.log(
          `[mate in ${mateIn}] ${bucket.count}/${PUZZLES_PER_BUCKET}  fen="${fen}"  solution=${JSON.stringify(solution)}`
        );
      } catch (err) {
        // Unique constraint race (re-run overlap) — not fatal.
        console.warn(`Insert failed for ${fen}: ${(err as Error).message}`);
      }
    }

    if (gamesScanned % 2000 === 0) {
      console.log(`...scanned ${gamesScanned} games, evaluated ${candidatesEvaluated} candidates.`);
      logProgress(buckets);
    }
  }

  console.log(`\nDone. Scanned ${gamesScanned}/${games.length} games, evaluated ${candidatesEvaluated} candidates.`);
  logProgress(buckets);

  const unfilled = [...buckets.values()].filter((b) => b.count < PUZZLES_PER_BUCKET);
  if (unfilled.length > 0) {
    console.warn(
      `\nWARNING: could not fill all buckets from this data source. Still short: ${unfilled
        .map((b) => `mate-in-${b.mateIn} (${b.count}/${PUZZLES_PER_BUCKET})`)
        .join(", ")}`
    );
  }
}

function allBucketsFull(buckets: Map<number, Bucket>): boolean {
  return [...buckets.values()].every((b) => b.count >= PUZZLES_PER_BUCKET);
}

function logProgress(buckets: Map<number, Bucket>) {
  const line = [...buckets.values()]
    .map((b) => `mate-in-${b.mateIn}: ${b.count}/${PUZZLES_PER_BUCKET}`)
    .join("  |  ");
  console.log(line);
}

/** Splits the raw PGN dump into individual game blocks (headers + movetext). */
function splitGames(pgnText: string): string[] {
  const games: string[] = [];
  const lines = pgnText.split(/\r?\n/);
  let current: string[] = [];
  for (const line of lines) {
    if (line.startsWith("[Event ") && current.length > 0) {
      games.push(current.join("\n"));
      current = [];
    }
    current.push(line);
  }
  if (current.some((l) => l.trim().length > 0)) games.push(current.join("\n"));
  return games;
}

interface Candidate {
  fen: string;
  hypotheticalMateIn: number;
}

/**
 * Returns up to MAX_MATE_IN candidate FENs for a game that genuinely ended in
 * checkmate, or null if the game doesn't qualify (no checkmate, unparsable).
 * Candidate k's FEN is the position immediately before the mating side's
 * k-th-from-last move — i.e. exactly what would need to be a forced mate in k
 * (in the mating side's own moves) for the game's actual ending to be
 * consistent with it. Stockfish's own verdict is what actually decides the
 * bucket, not this k.
 */
function extractCandidates(gameText: string): Candidate[] | null {
  // Cheap pre-filter: only bother parsing games whose movetext contains a
  // checkmate marker at all.
  if (!gameText.includes("#")) return null;

  const chess = new Chess();
  try {
    chess.loadPgn(gameText);
  } catch {
    return null;
  }

  if (!chess.isCheckmate()) return null;

  const history = chess.history({ verbose: true });
  const plyCount = history.length;
  if (plyCount === 0) return null;

  const candidates: Candidate[] = [];
  for (let k = 1; k <= MAX_MATE_IN; k++) {
    const idx = plyCount - (2 * k - 1);
    if (idx < 0) break;
    candidates.push({ fen: history[idx].before, hypotheticalMateIn: k });
  }
  return candidates.length > 0 ? candidates : null;
}

main()
  .catch((err) => {
    console.error("Generation failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    engine.quit();
    await prisma.$disconnect();
  });
