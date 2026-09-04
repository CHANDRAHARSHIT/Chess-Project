/**
 * Rating Service — pure Elo computation.
 *
 * Frozen constants and reasoning: m4_implementation_plan.md §2.
 * No I/O, no side effects — mirrors the purity convention used by
 * backend/src/variant/chess960/chess960Rules.ts.
 */

/** New-account starting rating. Matches chess.com's well-known default. */
export const DEFAULT_RATING = 1200;

/** K-factor while a player is "provisional" (mirrors FIDE's own <30-games rule). */
export const PROVISIONAL_K = 40;

/** K-factor once a player is "established" (30+ rated games). */
export const ESTABLISHED_K = 20;

/** Games-played threshold separating provisional from established. */
export const PROVISIONAL_GAMES_THRESHOLD = 30;

/** Standard Elo expected-score divisor. Universal constant, not a platform choice. */
const ELO_DIVISOR = 400;

/** Score used in the Elo formula for each outcome. Draw is always 0.5 for both sides. */
export const ELO_SCORE = {
  WIN: 1,
  DRAW: 0.5,
  LOSS: 0,
} as const;

/** Returns the K-factor for a player with the given number of previously rated games. */
export function kFactorFor(gamesPlayed: number): number {
  return gamesPlayed < PROVISIONAL_GAMES_THRESHOLD ? PROVISIONAL_K : ESTABLISHED_K;
}

/**
 * Computes the rating delta for one side of a 2-player game.
 *
 * @param ratingSelf  Current rating of the player being scored.
 * @param ratingOpp   Current rating of the opponent.
 * @param score       Actual score for this player: 1 (win), 0.5 (draw), 0 (loss).
 * @param kFactor     This player's own K-factor (from kFactorFor()).
 */
export function computeEloDelta(
  ratingSelf: number,
  ratingOpp: number,
  score: number,
  kFactor: number
): number {
  const expected = 1 / (1 + 10 ** ((ratingOpp - ratingSelf) / ELO_DIVISOR));
  return Math.round(kFactor * (score - expected));
}
