/**
 * maiaHelpers.ts
 *
 * Strength configurations, piece values, and material differential calculations for Maia-3 games.
 */

export interface MaiaStrength {
  elo: number;
  name: string;
  short: string;
  tag: string;
}

export const STRENGTHS: readonly MaiaStrength[] = [
  { elo: 800, name: "Beginner", short: "800", tag: "Novice" },
  { elo: 1100, name: "Casual", short: "1100", tag: "Club Novice" },
  { elo: 1400, name: "Intermediate", short: "1400", tag: "Club Intermediate" },
  { elo: 1700, name: "Club", short: "1700", tag: "Tournament" },
  { elo: 2000, name: "Strong", short: "2000", tag: "Expert" },
  { elo: 2300, name: "Expert", short: "2300", tag: "Candidate Master" },
  { elo: 2600, name: "Master", short: "2600", tag: "Grandmaster" },
] as const;

export type PieceType = "p" | "n" | "b" | "r" | "q";

export interface CapturedPieceGroup {
  piece: PieceType;
  count: number;
}

export interface MaterialBalance {
  /** Black pieces captured by White */
  whiteCaptured: CapturedPieceGroup[];
  /** White pieces captured by Black */
  blackCaptured: CapturedPieceGroup[];
  /** Material score difference from White's perspective (+ means White is up material) */
  whiteAdvantage: number;
}

const PIECE_ORDER: PieceType[] = ["q", "r", "b", "n", "p"];

const INITIAL_PIECE_COUNTS: Record<PieceType, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
};

const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};

/**
 * Calculates captured pieces and material balance from a standard FEN string.
 */
export function getCapturedPieces(fen: string): MaterialBalance {
  const boardPlacement = fen.split(" ")[0] || "";

  const currentWhiteCounts: Record<PieceType, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };
  const currentBlackCounts: Record<PieceType, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };

  for (const char of boardPlacement) {
    if (char === "P") currentWhiteCounts.p += 1;
    else if (char === "N") currentWhiteCounts.n += 1;
    else if (char === "B") currentWhiteCounts.b += 1;
    else if (char === "R") currentWhiteCounts.r += 1;
    else if (char === "Q") currentWhiteCounts.q += 1;
    else if (char === "p") currentBlackCounts.p += 1;
    else if (char === "n") currentBlackCounts.n += 1;
    else if (char === "b") currentBlackCounts.b += 1;
    else if (char === "r") currentBlackCounts.r += 1;
    else if (char === "q") currentBlackCounts.q += 1;
  }

  const whiteCaptured: CapturedPieceGroup[] = [];
  const blackCaptured: CapturedPieceGroup[] = [];

  let whiteMaterial = 0;
  let blackMaterial = 0;

  for (const type of PIECE_ORDER) {
    // Pieces Black lost = captured by White
    const blackLost = Math.max(0, INITIAL_PIECE_COUNTS[type] - currentBlackCounts[type]);
    if (blackLost > 0) {
      whiteCaptured.push({ piece: type, count: blackLost });
    }

    // Pieces White lost = captured by Black
    const whiteLost = Math.max(0, INITIAL_PIECE_COUNTS[type] - currentWhiteCounts[type]);
    if (whiteLost > 0) {
      blackCaptured.push({ piece: type, count: whiteLost });
    }

    whiteMaterial += currentWhiteCounts[type] * PIECE_VALUES[type];
    blackMaterial += currentBlackCounts[type] * PIECE_VALUES[type];
  }

  return {
    whiteCaptured,
    blackCaptured,
    whiteAdvantage: whiteMaterial - blackMaterial,
  };
}

/**
 * Returns clean Unicode glyphs for captured pieces display.
 */
export function getPieceGlyph(piece: PieceType, color: "w" | "b"): string {
  const whiteGlyphs: Record<PieceType, string> = {
    p: "♙",
    n: "♘",
    b: "♗",
    r: "♖",
    q: "♕",
  };
  const blackGlyphs: Record<PieceType, string> = {
    p: "♟",
    n: "♞",
    b: "♝",
    r: "♜",
    q: "♛",
  };
  return color === "w" ? whiteGlyphs[piece] : blackGlyphs[piece];
}
