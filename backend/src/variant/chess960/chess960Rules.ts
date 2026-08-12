import { Chess } from "chess.js";
import type { Move } from "../../contracts/index.js";

/**
 * Pure Chess960 rule helpers.
 * Fully deterministic, zero I/O, zero side effects.
 */

/**
 * Generates the FEN for a Chess960 starting position ID (0–959)
 * using the official Scharnagl 960 numbering algorithm.
 */
export function generateStartingFen(positionId: number): string {
  if (positionId < 0 || positionId > 959 || !Number.isInteger(positionId)) {
    throw new Error(`Invalid Chess960 positionId: ${positionId}. Must be an integer between 0 and 959.`);
  }

  const backRank = generateBackRank(positionId);
  const whiteBackRank = backRank.join("");
  const blackBackRank = whiteBackRank.toLowerCase();

  // FEN format: <blackRank>/pppppppp/8/8/8/8/PPPPPPPP/<whiteRank> w KQkq - 0 1
  return `${blackBackRank}/pppppppp/8/8/8/8/PPPPPPPP/${whiteBackRank} w KQkq - 0 1`;
}

/**
 * Scharnagl numbering algorithm (0–959 -> 8-piece back rank).
 */
function generateBackRank(positionId: number): string[] {
  const pieces = new Array<string>(8).fill("");

  // 1. Dark-squared bishop (positions 1, 3, 5, 7)
  const d1 = positionId % 4;
  const darkBishopPos = d1 * 2 + 1;
  pieces[darkBishopPos] = "B";

  let rem1 = Math.floor(positionId / 4);

  // 2. Light-squared bishop (positions 0, 2, 4, 6)
  const d2 = rem1 % 4;
  const lightBishopPos = d2 * 2;
  pieces[lightBishopPos] = "B";

  let rem2 = Math.floor(rem1 / 4);

  // 3. Queen placement in remaining 6 empty slots (0..5)
  const qPosIndex = rem2 % 6;
  let rem3 = Math.floor(rem2 / 6);

  let emptyCount = 0;
  for (let i = 0; i < 8; i++) {
    if (pieces[i] === "") {
      if (emptyCount === qPosIndex) {
        pieces[i] = "Q";
        break;
      }
      emptyCount++;
    }
  }

  // 4. Knight placements in remaining 5 empty slots (code 0..9)
  const knightCode = rem3; // 0..9
  const knightPositions = KNIGHT_PATTERNS[knightCode] || [0, 1];

  emptyCount = 0;
  let knightInserted = 0;
  for (let i = 0; i < 8; i++) {
    if (pieces[i] === "") {
      if (knightPositions.includes(emptyCount)) {
        pieces[i] = "N";
        knightInserted++;
      }
      emptyCount++;
    }
  }

  // 5. Remaining 3 empty slots get R, K, R in order
  let rkrIndex = 0;
  const rkr = ["R", "K", "R"];
  for (let i = 0; i < 8; i++) {
    if (pieces[i] === "") {
      pieces[i] = rkr[rkrIndex++];
    }
  }

  return pieces;
}

// 10 combinations of choosing 2 items from 5
const KNIGHT_PATTERNS: Record<number, number[]> = {
  0: [0, 1],
  1: [0, 2],
  2: [0, 3],
  3: [0, 4],
  4: [1, 2],
  5: [1, 3],
  6: [1, 4],
  7: [2, 3],
  8: [2, 4],
  9: [3, 4],
};

/**
 * Validates a move against the given FEN state and side index (0 = White, 1 = Black).
 */
export function validateMoveFen(
  fen: string,
  move: Move,
  sideIndex: number
): { legal: boolean; reason?: string } {
  const activeSide = getActiveSideIndex(fen);
  if (sideIndex !== activeSide) {
    return {
      legal: false,
      reason: `It is not side ${sideIndex}'s turn. Current turn: side ${activeSide}.`,
    };
  }

  const from = typeof move.from === "string" ? move.from : "";
  const to = typeof move.to === "string" ? move.to : "";
  const promotion = typeof move.promotion === "string" ? move.promotion : undefined;

  if (!from || !to) {
    return { legal: false, reason: "Move must include 'from' and 'to' square coordinates." };
  }

  try {
    const chess = new Chess(fen);
    const possibleMoves = chess.moves({ verbose: true });
    const isLegal = possibleMoves.some(
      (m) =>
        m.from === from &&
        m.to === to &&
        (!promotion || m.promotion === promotion)
    );

    if (!isLegal) {
      return { legal: false, reason: `Move ${from}-${to} is illegal in the current position.` };
    }

    return { legal: true };
  } catch (err) {
    return { legal: false, reason: `Invalid FEN or move format: ${(err as Error).message}` };
  }
}

/**
 * Applies a legal move to a FEN state and returns the new FEN.
 * Does not mutate the input string.
 */
export function applyMoveFen(fen: string, move: Move): string {
  const chess = new Chess(fen);
  const from = typeof move.from === "string" ? move.from : "";
  const to = typeof move.to === "string" ? move.to : "";
  const promotion = typeof move.promotion === "string" ? move.promotion : undefined;

  chess.move({ from, to, promotion });
  return chess.fen();
}

/**
 * Returns all legal moves for the given side in the given FEN position.
 */
export function legalMovesFromFen(fen: string, sideIndex: number): Move[] {
  const activeSide = getActiveSideIndex(fen);
  if (sideIndex !== activeSide) {
    return [];
  }

  try {
    const chess = new Chess(fen);
    const verboseMoves = chess.moves({ verbose: true });
    return verboseMoves.map((m) => ({
      from: m.from,
      to: m.to,
      san: m.san,
      ...(m.promotion ? { promotion: m.promotion } : {}),
    }));
  } catch {
    return [];
  }
}

/** Returns true if the position is in checkmate. */
export function isCheckmate(fen: string): boolean {
  try {
    const chess = new Chess(fen);
    return chess.isCheckmate();
  } catch {
    return false;
  }
}

/** Returns true if the position is in stalemate. */
export function isStalemate(fen: string): boolean {
  try {
    const chess = new Chess(fen);
    return chess.isStalemate();
  } catch {
    return false;
  }
}

/** Returns true if the position is a draw (stalemate, 50-move, insufficient material, 3-fold repetition). */
export function isDraw(fen: string): boolean {
  try {
    const chess = new Chess(fen);
    return chess.isDraw();
  } catch {
    return false;
  }
}

/** Returns the active side index (0 = White, 1 = Black). */
export function getActiveSideIndex(fen: string): number {
  const parts = fen.split(" ");
  return parts[1] === "b" ? 1 : 0;
}
