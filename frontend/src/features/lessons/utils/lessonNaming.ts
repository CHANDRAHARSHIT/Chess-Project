/**
 * Helper to determine the next available untitled lesson name.
 * Format:
 * - Untitled Lesson
 * - Untitled Lesson (1)
 * - Untitled Lesson (2)
 * ...
 */
export function getNextUntitledTitle(existingTitles: string[]): string {
  const normalized = existingTitles.map((t) => (t || "").trim().toLowerCase());

  if (!normalized.includes("untitled lesson")) {
    return "Untitled Lesson";
  }

  let counter = 1;
  while (normalized.includes(`untitled lesson (${counter})`)) {
    counter++;
  }

  return `Untitled Lesson (${counter})`;
}
