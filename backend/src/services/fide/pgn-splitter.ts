/**
 * pgn-splitter.ts
 * Robust PGN game-boundary splitting for bulk PGN files.
 *
 * Uses a line-anchored regex to detect game boundaries rather than
 * a raw substring search, which is fragile against comments/annotations
 * that may contain "[Event" text.
 *
 * A game boundary is detected when a line starts with [Event " at
 * column 0, preceded by either the start of the file or a blank line
 * (standard PGN inter-game separator).
 */

/**
 * Split a bulk PGN string into individual game strings.
 * Each returned string is a complete game (headers + movetext).
 */
export function splitPgnFile(content: string): string[] {
  // Normalize line endings to \n
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split on game boundaries: [Event " at the start of a line,
  // preceded by start-of-string OR one or more blank lines.
  // We use a lookahead so the [Event line itself is preserved in the chunk.
  const chunks = normalized.split(/\n\n(?=\[Event ")/);

  const games: string[] = [];

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    // Validate: a real game chunk must start with [Event "
    // This catches any leading junk or annotation fragments that
    // happened to land before the first [Event in the file.
    if (!trimmed.startsWith('[Event "')) {
      // Could be preamble text before the first game — skip silently
      continue;
    }

    games.push(trimmed);
  }

  return games;
}
