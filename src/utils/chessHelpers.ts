/**
 * Parses a UCI move string (e.g., "e2e4" or "e7e8q") into from, to, and promotion parts
 */
export function parseUciMove(move: string) {
  const from = move.slice(0, 2);
  const to = move.slice(2, 4);
  const promotion = move.length > 4 ? move.slice(4, 5) : undefined;
  
  return { from, to, promotion };
}

/**
 * Capitalizes a string (e.g. "w" -> "White")
 */
export function formatColor(color: 'w' | 'b'): string {
  return color === 'w' ? 'White' : 'Black';
}

/**
 * Checks if a game-over reason exists and returns a user-friendly string
 */
export function getGameOverReason(game: {
  isCheckmate: () => boolean;
  isDraw: () => boolean;
  isStalemate: () => boolean;
  isThreefoldRepetition: () => boolean;
  isInsufficientMaterial: () => boolean;
}): string | null {
  if (game.isCheckmate()) return "Checkmate! Game over.";
  if (game.isStalemate()) return "Draw by stalemate.";
  if (game.isThreefoldRepetition()) return "Draw by threefold repetition.";
  if (game.isInsufficientMaterial()) return "Draw by insufficient material.";
  if (game.isDraw()) return "Draw game.";
  return null;
}
