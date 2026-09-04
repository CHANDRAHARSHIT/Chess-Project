/**
 * importOppositionPuzzles.ts
 * ----------------------------
 * "Opposition" isn't a Lichess theme tag, but it's a fully-defined chess
 * concept: two kings face each other on the same file/rank/diagonal with
 * exactly one square between them ("direct opposition"). We mine Lichess's
 * pawnEndgame-tagged puzzles for cases where (a) only kings and pawns remain
 * on the board and (b) the solver's first move creates direct opposition —
 * a rigorous, checkable definition rather than a fabricated match.
 *
 * Run with: npx tsx src/scripts/importOppositionPuzzles.ts
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
const THEME = "opposition";

function isKingsAndPawnsOnly(chess: Chess): boolean {
  const board = chess.board();
  for (const row of board) {
    for (const sq of row) {
      if (sq && sq.type !== "k" && sq.type !== "p") return false;
    }
  }
  return true;
}

function isDirectOpposition(chess: Chess): boolean {
  const board = chess.board();
  let white: { r: number; f: number } | null = null;
  let black: { r: number; f: number } | null = null;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = board[r][f];
      if (sq?.type === "k") {
        if (sq.color === "w") white = { r, f };
        else black = { r, f };
      }
    }
  }
  if (!white || !black) return false;
  const dr = Math.abs(white.r - black.r);
  const df = Math.abs(white.f - black.f);
  const sameFile = df === 0 && dr === 2;
  const sameRank = dr === 0 && df === 2;
  const sameDiagonal = dr === 2 && df === 2;
  return sameFile || sameRank || sameDiagonal;
}

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
    if (!themesStr.split(" ").includes("pawnEndgame")) continue;

    const moves = movesStr.split(" ");
    if (moves.length < 2) continue;

    const chess = new Chess(fen);
    try {
      chess.move({ from: moves[0].slice(0, 2), to: moves[0].slice(2, 4), promotion: moves[0].slice(4) || undefined });
    } catch {
      continue;
    }
    if (!isKingsAndPawnsOnly(chess)) continue;

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
    if (!isDirectOpposition(chess)) continue;

    // Replay the rest for integrity, matching the project's verification bar.
    let replayOk = true;
    for (const uci of solution.slice(1)) {
      try {
        chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4) || undefined });
      } catch {
        replayOk = false;
        break;
      }
    }
    if (!replayOk) continue;

    seenFens.add(puzzleFen);
    const rating = Number(ratingStr) || 1000;

    try {
      const created = await prisma.odysseyPuzzle.create({
        data: {
          fen: puzzleFen,
          solution,
          puzzleRatingDifficulty: rating,
          type: "BEST_MOVE",
          source: SOURCE,
        },
      });
      await prisma.odysseyPuzzleTheme.create({ data: { puzzleId: created.id, theme: THEME } });
      count++;
      console.log(`[opposition] ${count}/${TARGET}  fen="${puzzleFen}"`);
    } catch (err) {
      console.warn(`Insert failed: ${(err as Error).message}`);
    }

    if (rowsScanned % 500_000 === 0) console.log(`...scanned ${rowsScanned} rows, count=${count}`);
  }

  console.log(`\nDone. Scanned ${rowsScanned} rows. Final opposition count: ${count}/${TARGET}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
