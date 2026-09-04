import type { RelicType } from "@/features/story-mode/StoryModeContext";

/**
 * Mirrors backend/src/models/odyssey/models/seededRng.ts exactly (same
 * mulberry32 algorithm) — given the same seed string, produces the same
 * sequence of numbers as the backend, so the prices this computes match
 * what OdysseyMerchantService will actually charge.
 */
function createSeededRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Mirrors OdysseyMerchant.ts's rollPrice()/RELIC_TYPES iteration order exactly.
const PRICE_BASE = 20;
const PRICE_JITTER = 11;
const PRICE_JITTER_OFFSET = 5;
const PRICE_FLOOR = 5;
const RELIC_ORDER: RelicType[] = ["undo", "hint", "evalBar", "time", "reroll"];

/**
 * Computes the same per-charge prices the backend will independently derive
 * for a shop visit, so what's displayed matches what a purchase actually
 * charges. `seed` must be `${gameId}:${nodeId}` — the same seed
 * OdysseyMerchantService uses server-side. Iteration order matters: the
 * seeded RNG is stateful, so RELIC_ORDER must match ERelicType's declared
 * order exactly for the same seed to produce the same per-type prices.
 */
export function computeServerPrices(seed: string): Record<RelicType, number> {
  const rng = createSeededRng(seed);
  const prices = {} as Record<RelicType, number>;
  for (const type of RELIC_ORDER) {
    prices[type] = Math.max(PRICE_FLOOR, PRICE_BASE + Math.floor(rng() * PRICE_JITTER) - PRICE_JITTER_OFFSET);
  }
  return prices;
}
