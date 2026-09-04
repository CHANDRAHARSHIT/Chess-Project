/**
 * importMatingNetPuzzles.ts
 * ----------------------------
 * "Mating Net" isn't a Lichess theme tag. Chess literature uses it for mate
 * sequences that start with a *quiet* move restricting the king before the
 * forcing/mating moves come — as opposed to a mate sequence that is check
 * from the first move. We use that as a rigorous, checkable definition:
 * mateIn >= 3 AND the solver's first move does not give check.
 *
 * Run with: npx tsx src/scripts/importMatingNetPuzzles.ts
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
const TARGET = 100;
const SOURCE = "lichess_db_puzzle";
const THEME = "matingNet";

async function main() {
  let count = await prisma.odysseyPuzzleTheme.count({ where: { theme: THEME } });
  console.log("Starting count:", count);

  const seenFens = new Set<string>(
    (await prisma.odysseyPuzzle.findMany({ select: { fen: true } })).map((p) => p.fen)
  );

  const rl = readline.createInterface({
    input: fs.createReadStream(CSV_PATH),
    crlfDelay: Infinity,
  });

  let first = true;
  let rowsScanned = 0;

  for await (const line of rl) {
    if (first) {
      first = false;
      continue;
    }
    if (count >= TARGET) break;
    if (!line) continue;
    rowsScanned++;

    const parts = line.split(",");
    const [, fen, movesStr, ratingStr, , , , themesStr] = parts;
    if (!fen || !movesStr || !themesStr) continue;
    const themeSet = new Set(themesStr.split(" ").filter(Boolean));
    if (!themeSet.has("mate")) continue;
    const hasLongMate = themeSet.has("mateIn3") || themeSet.has("mateIn4") || themeSet.has("mateIn5");
    if (!hasLongMate) continue;

    const moves = movesStr.split(" ");
    if (moves.length < 2) continue;

    const chess = new Chess(fen);
    try {
      chess.move({ from: moves[0].slice(0, 2), to: moves[0].slice(2, 4), promotion: moves[0].slice(4) || undefined });
    } catch {
      continue;
    }
    const puzzleFen = chess.fen();
    if (seenFens.has(puzzleFen)) continue;

    const solution = moves.slice(1);
    const firstSolverMove = solution[0];
    if (!firstSolverMove) continue;

    let moveOk = true;
    try {
      chess.move({
        from: firstSolverMove.slice(0, 2),
        to: firstSolverMove.slice(2, 4),
        promotion: firstSolverMove.slice(4) || undefined,
      });
    } catch {
      moveOk = false;
    }
    if (!moveOk) continue;
    // The defining trait: the net-building first move is quiet, not check.
    if (chess.inCheck()) continue;

    let replayOk = true;
    for (const uci of solution.slice(1)) {
      try {
        chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4) || undefined });
      } catch {
        replayOk = false;
        break;
      }
    }
    if (!replayOk || !chess.isCheckmate()) continue;

    seenFens.add(puzzleFen);
    const mateIn = Math.ceil(solution.length / 2);
    const rating = Number(ratingStr) || 1000;

    try {
      const created = await prisma.odysseyPuzzle.create({
        data: {
          fen: puzzleFen,
          solution,
          puzzleRatingDifficulty: rating,
          type: "FIND_MATE",
          mateIn,
          source: SOURCE,
        },
      });
      await prisma.odysseyPuzzleTheme.create({ data: { puzzleId: created.id, theme: THEME } });
      await prisma.odysseyPuzzleTheme
        .create({ data: { puzzleId: created.id, theme: `mateIn${mateIn}` } })
        .catch(() => {});
      count++;
      console.log(`[matingNet] ${count}/${TARGET}  mateIn=${mateIn}  fen="${puzzleFen}"`);
    } catch (err) {
      console.warn(`Insert failed: ${(err as Error).message}`);
    }

    if (rowsScanned % 500_000 === 0) console.log(`...scanned ${rowsScanned} rows, count=${count}`);
  }

  console.log(`\nDone. Scanned ${rowsScanned} rows. Final matingNet count: ${count}/${TARGET}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
