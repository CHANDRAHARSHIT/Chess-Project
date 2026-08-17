/**
 * chess960PositionId.ts
 * Display-only port of the backend's Scharnagl numbering algorithm
 * (backend/src/variant/chess960/chess960Rules.ts), used solely to render the true starting
 * position on the MatchFoundCard from the positionId the server already chose. This never
 * feeds move validation — Session/Variant remain the sole rules authority; this is decorative,
 * matching the deliberate client/server rules duplication already accepted in Phase 3 §6.
 */

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

function generateBackRank(positionId: number): string[] {
  const pieces = new Array<string>(8).fill("");

  const d1 = positionId % 4;
  pieces[d1 * 2 + 1] = "B";
  const rem1 = Math.floor(positionId / 4);

  const d2 = rem1 % 4;
  pieces[d2 * 2] = "B";
  const rem2 = Math.floor(rem1 / 4);

  const qPosIndex = rem2 % 6;
  const rem3 = Math.floor(rem2 / 6);

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

  const knightPositions = KNIGHT_PATTERNS[rem3] || [0, 1];
  emptyCount = 0;
  for (let i = 0; i < 8; i++) {
    if (pieces[i] === "") {
      if (knightPositions.includes(emptyCount)) pieces[i] = "N";
      emptyCount++;
    }
  }

  let rkrIndex = 0;
  const rkr = ["R", "K", "R"];
  for (let i = 0; i < 8; i++) {
    if (pieces[i] === "") pieces[i] = rkr[rkrIndex++];
  }

  return pieces;
}

/** Deterministically rebuilds the starting FEN for a given Chess960 positionId (0–959). */
export function generateStartingFenFromPositionId(positionId: number): string {
  if (!Number.isInteger(positionId) || positionId < 0 || positionId > 959) {
    return "start";
  }
  const whiteBackRank = generateBackRank(positionId).join("");
  const blackBackRank = whiteBackRank.toLowerCase();
  return `${blackBackRank}/pppppppp/8/8/8/8/PPPPPPPP/${whiteBackRank} w KQkq - 0 1`;
}
