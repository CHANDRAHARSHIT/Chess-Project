/**
 * routeMatcher.ts
 * Manages route spelling suggestions using Levenshtein Distance for public routes.
 */

// Explicitly whitelist only public, directly accessible pages.
// Sensitive, dashboard, api, or payment success paths must NEVER be added here.
export const PUBLIC_ROUTES_WHITELIST = [
  '/',
  '/puzzles',
  '/pricing',
  '/leaderboard',
  '/about',
  '/contact'
];

/**
 * Calculates the Levenshtein distance between two strings.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1, // Deletion
        tmp[i][j - 1] + 1, // Insertion
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // Substitution
      );
    }
  }
  return tmp[a.length][b.length];
}

/**
 * Suggests a matching public route if the user makes a minor spelling mistake.
 * If multiple routes are equally close, returns null to avoid ambiguity.
 */
export function suggestRoute(
  requestedPath: string,
  whitelist: string[] = PUBLIC_ROUTES_WHITELIST,
  maxDistance = 2,
  minSimilarity = 0.65
): string | null {
  // Normalize the input (remove trailing slashes, trim, lower-case)
  const normalizedRequested = requestedPath.trim().toLowerCase().replace(/\/+$/, '') || '/';

  let bestMatch: string | null = null;
  let bestScore = -1;
  let matchesCountAtBestScore = 0;

  for (const route of whitelist) {
    const normalizedRoute = route.trim().toLowerCase().replace(/\/+$/, '') || '/';
    const dist = getLevenshteinDistance(normalizedRequested, normalizedRoute);
    const score = 1.0 - dist / Math.max(normalizedRequested.length, normalizedRoute.length);

    if (dist <= maxDistance && score >= minSimilarity) {
      if (score > bestScore) {
        bestScore = score;
        bestMatch = route;
        matchesCountAtBestScore = 1;
      } else if (score === bestScore) {
        matchesCountAtBestScore++;
      }
    }
  }

  // Return the match if there was exactly ONE clear best suggestion
  if (matchesCountAtBestScore === 1) {
    return bestMatch;
  }
  return null;
}
