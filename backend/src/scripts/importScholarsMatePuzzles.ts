/**
 * importScholarsMatePuzzles.ts
 * ------------------------------
 * "Scholar's Mate" isn't a Lichess theme tag either, and it's too narrow a
 * pattern to expect from a puzzle-mining pipeline — so we go back to real
 * games directly (same PGN dumps generateMatePuzzles.ts used) and pattern-
 * match the canonical four-move mate: checkmate within the first 4 full
 * moves (8 plies), delivered by the queen capturing on f7 (white mates) or
 * f2 (black mates).
 *
 * Run with: npx tsx src/scripts/importScholarsMatePuzzles.ts
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

const TARGET = 100;
const THEME = "scholarsMate";
const MAX_PLY = 8; // four full moves, the canonical "four-move mate"

const PGN_FILES = ["data/lichess_2014-01.pgn"];

/** Streams a PGN dump, yielding one full game block (headers + movetext) at a time. */
async function* streamGames(path: string): AsyncGenerator<string> {
  const rl = readline.createInterface({
    input: fs.createReadStream(path),
    crlfDelay: Infinity,
  });

  let current: string[] = [];
  for await (const line of rl) {
    if (line.startsWith("[Event ") && current.length > 0) {
      yield current.join("\n");
      current = [];
    }
    current.push(line);
  }
  if (current.some((l) => l.trim().length > 0)) yield current.join("\n");
}

async function main() {
  let count = await prisma.odysseyPuzzleTheme.count({ where: { theme: THEME } });
  console.log("Starting count:", count);

  const seenFens = new Set<string>(
    (await prisma.odysseyPuzzle.findMany({ select: { fen: true } })).map((p) => p.fen)
  );

  let gamesScanned = 0;

  for (const path of PGN_FILES) {
    if (count >= TARGET) break;
    console.log(`Scanning ${path}...`);

    for await (const gameText of streamGames(path)) {
      if (count >= TARGET) break;
      gamesScanned++;
      if (!gameText.includes("#")) continue;

      const chess = new Chess();
      try {
        chess.loadPgn(gameText);
      } catch {
        continue;
      }
      if (!chess.isCheckmate()) continue;

      const history = chess.history({ verbose: true });
      if (history.length === 0 || history.length > MAX_PLY) continue;

      const lastMove = history[history.length - 1];
      const matingSquare = lastMove.color === "w" ? "f7" : "f2";
      if (lastMove.piece !== "q" || lastMove.to !== matingSquare || !lastMove.captured) continue;

      const puzzleFen = lastMove.before;
      if (seenFens.has(puzzleFen)) continue;
      seenFens.add(puzzleFen);

      const solution = [`${lastMove.from}${lastMove.to}`];

      try {
        const created = await prisma.odysseyPuzzle.create({
          data: {
            fen: puzzleFen,
            solution,
            puzzleRatingDifficulty: 1000,
            type: "FIND_MATE",
            mateIn: 1,
            source: "lichess_pgn_real_games",
          },
        });
        await prisma.odysseyPuzzleTheme.create({ data: { puzzleId: created.id, theme: THEME } });
        await prisma.odysseyPuzzleTheme
          .create({ data: { puzzleId: created.id, theme: "mateIn1" } })
          .catch(() => {});
        count++;
        console.log(`[scholarsMate] ${count}/${TARGET}  fen="${puzzleFen}"`);
      } catch (err) {
        console.warn(`Insert failed: ${(err as Error).message}`);
      }
    }
  }

  console.log(`\nDone. Scanned ${gamesScanned} games. Final scholarsMate count: ${count}/${TARGET}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
