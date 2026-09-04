/**
 * A small deterministic PRNG (mulberry32) keyed off a string seed — used
 * anywhere Odyssey needs a value that's reproducible from data both the
 * client and server already agree on (a run/node/item combination), rather
 * than genuinely random. OdysseyMap uses this for map generation when given
 * a seed; OdysseyMerchant uses it to derive server-verifiable per-visit
 * prices without persisting a shop catalog (see OdysseyMerchant.open).
 */
export function createSeededRng(seed: string): () => number {
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
