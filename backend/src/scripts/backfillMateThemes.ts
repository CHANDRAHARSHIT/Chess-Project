/**
 * backfillMateThemes.ts
 * ----------------------
 * One-off: tags the 500 existing FIND_MATE puzzles with theme labels
 * ("mateIn1".."mateIn5") and detects "backRankMate" among them by replaying
 * each solution and checking the final mated position.
 *
 * Run with: npx tsx src/scripts/backfillMateThemes.ts
 */
import "dotenv/config";
import { Chess } from "chess.js";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/** Back rank mate: mated king on its home rank (1 or 8), trapped by its own pawns. */
function isBackRankMate(chess: Chess): boolean {
  const board = chess.board();
  const turn = chess.turn(); // side that is mated (side to move, no legal moves)
  const homeRank = turn === "w" ? 0 : 7; // board()[0] = rank 8, board()[7] = rank 1
  const kingRow = board[turn === "w" ? 7 : 0]; // rank 1 for white, rank 8 for black
  void homeRank;
  const kingSquare = kingRow.find((sq) => sq && sq.type === "k" && sq.color === turn);
  if (!kingSquare) return false;

  const kingRankIndex = turn === "w" ? 7 : 0; // 0-indexed from rank 8 at index 0
  const pawnRankIndex = turn === "w" ? 6 : 1; // one rank in front of the king
  const pawnRow = board[pawnRankIndex];
  const ownPawnsBlocking = pawnRow.filter((sq) => sq && sq.type === "p" && sq.color === turn).length;

  return kingRankIndex === (turn === "w" ? 7 : 0) && ownPawnsBlocking >= 2;
}

async function main() {
  const puzzles = await prisma.odysseyPuzzle.findMany({
    where: { type: "FIND_MATE" },
  });
  console.log(`Found ${puzzles.length} FIND_MATE puzzles to tag.`);

  let backRankCount = 0;
  for (const puzzle of puzzles) {
    const themes = new Set<string>();
    if (puzzle.mateIn) themes.add(`mateIn${puzzle.mateIn}`);

    const chess = new Chess(puzzle.fen);
    const solution = puzzle.solution as string[];
    let ok = true;
    for (const uci of solution) {
      try {
        chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4) || undefined });
      } catch {
        ok = false;
        break;
      }
    }
    if (ok && chess.isCheckmate() && isBackRankMate(chess)) {
      themes.add("backRankMate");
      backRankCount++;
    }

    for (const theme of themes) {
      await prisma.odysseyPuzzleTheme.upsert({
        where: { puzzleId_theme: { puzzleId: puzzle.id, theme } },
        create: { puzzleId: puzzle.id, theme },
        update: {},
      });
    }
  }

  console.log(`Tagged ${puzzles.length} puzzles. backRankMate matches: ${backRankCount}.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
