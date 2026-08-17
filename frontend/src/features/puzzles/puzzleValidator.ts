import { Move } from 'chess.js';

/**
 * Validates if the user's played move matches the expected puzzle solution.
 * It compares both the UCI format (e.g., 'e2e4') and the SAN format (e.g., 'Qxf7#')
 * of the move against the expected solution to ensure maximum compatibility.
 * 
 * @param playedMove The move object returned by chess.js after a legal move.
 * @param expectedSolution The solution string from the puzzle database (can be UCI or SAN).
 * @returns boolean True if the move matches the solution, false otherwise.
 */
export function validateMove(playedMove: Move, expectedSolution: string): boolean {
  if (!playedMove || !expectedSolution) {
    return false;
  }

  // Extract the first target move if expectedSolution contains multiple space-separated moves
  const cleanSolution = expectedSolution.trim().split(/\s+/)[0];
  if (!cleanSolution) return false;

  // 1. Construct the played move in UCI format (e.g., 'e2e4' or 'e7e8q')
  const playedUci = `${playedMove.from}${playedMove.to}${playedMove.promotion || ''}`.toLowerCase();

  // 2. Extract SAN format (e.g., 'Qxf7#')
  const playedSan = playedMove.san.trim();

  // 3. Compare UCI formats (case-insensitive)
  if (playedUci === cleanSolution.toLowerCase()) {
    return true;
  }

  // 4. Compare from/to squares for UCI (handles optional promotion string matching)
  const playedFromTo = `${playedMove.from}${playedMove.to}`.toLowerCase();
  const cleanFromTo = cleanSolution.slice(0, 4).toLowerCase();
  if (playedFromTo === cleanFromTo) {
    if (cleanSolution.length === 5) {
      if ((playedMove.promotion || 'q').toLowerCase() === cleanSolution[4].toLowerCase()) {
        return true;
      }
    } else {
      return true;
    }
  }

  // 5. Compare SAN formats (exact match)
  if (playedSan === cleanSolution) {
    return true;
  }

  // 6. Permissive SAN comparison (ignores '+' or '#' suffixes)
  const cleanPlayedSan = playedSan.replace(/[+#]/g, '');
  const cleanExpectedSolution = cleanSolution.replace(/[+#]/g, '');
  if (cleanPlayedSan.toLowerCase() === cleanExpectedSolution.toLowerCase()) {
    return true;
  }

  return false;
}
