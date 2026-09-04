import type { VariantContract } from "../../contracts/index.js";
import { Chess960Variant } from "./chess960/chess960-variant.js";

/**
 * Registry of all available variant engines.
 * No switch(variantId) statements — ever (Invariant 8).
 */
export const variantRegistry = new Map<string, VariantContract>([
  [Chess960Variant.variantId, Chess960Variant],
]);
