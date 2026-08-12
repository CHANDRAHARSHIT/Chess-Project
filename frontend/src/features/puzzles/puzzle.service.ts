import type {
  CuratedPuzzle,
  PuzzleFilters,
  GetPuzzlesResponse,
  GetThemesResponse,
} from "@/features/puzzles/puzzle.types";
import rollbar from "@/shared/lib/rollbar";

// ─── Cache Configuration ───────────────────────────────────────────────────────
const PUZZLES_TTL_MS = 15 * 60 * 1000; // 15 minutes
const THEMES_TTL_MS  = 30 * 60 * 1000; // 30 minutes

interface PuzzlesCacheEntry {
  puzzles: CuratedPuzzle[];
  fetchedAt: number;
}

interface ThemesCacheEntry {
  themes: string[];
  fetchedAt: number;
}

// Module-level in-memory caches (survive component unmounts within the same session)
const puzzlesCache = new Map<string, PuzzlesCacheEntry>();
let themesCache: ThemesCacheEntry | null = null;

/** Serialize filter params into a stable cache key */
function buildCacheKey(filters: PuzzleFilters): string {
  const themes = (filters.themes ?? []).slice().sort().join(",");
  return `t=${themes}&min=${filters.minRating ?? ""}&max=${filters.maxRating ?? ""}&lim=${filters.limit ?? ""}`;
}

/**
 * PuzzleApiService
 * ----------------
 * Client-side service for fetching custom puzzles from the backend API.
 * All methods are static and return typed responses.
 *
 * Caching strategy (TTL-based):
 *  - getPuzzles  → 15-minute in-memory cache keyed by serialized filter params
 *  - getThemes   → 30-minute in-memory cache (single global entry)
 */
export class PuzzleApiService {
  /**
   * Fetches all distinct puzzle themes from the database.
   * Results are cached for 30 minutes.
   */
  static async getThemes(): Promise<string[]> {
    const now = Date.now();

    // Return cached themes if still fresh
    if (themesCache && now - themesCache.fetchedAt < THEMES_TTL_MS) {
      return themesCache.themes;
    }

    try {
      const res = await fetch("/api/puzzles/themes");

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as Record<string, unknown>).message as string || "Failed to fetch themes.");
      }

      const json: GetThemesResponse = await res.json();
      const themes = json.data?.themes ?? [];

      // Store in cache
      themesCache = { themes, fetchedAt: now };

      return themes;
    } catch (error: unknown) {
      console.error("[PuzzleApiService.getThemes] Error:", error);
      // Falls back to the stale cache below, so this never reaches the
      // ErrorBoundary — report it manually.
      rollbar.error(error instanceof Error ? error : new Error(String(error)), { context: "PuzzleApiService.getThemes" });
      // Return stale cache on error rather than empty, if available
      return themesCache?.themes ?? [];
    }
  }

  /**
   * Fetches puzzles filtered by themes and rating range.
   * Results are already sorted by rating ASC from the server.
   * Results are cached for 15 minutes per unique filter combination.
   */
  static async getPuzzles(filters: PuzzleFilters = {}): Promise<CuratedPuzzle[]> {
    const now = Date.now();
    const cacheKey = buildCacheKey(filters);

    // Return cached puzzles if still fresh
    const cached = puzzlesCache.get(cacheKey);
    if (cached && now - cached.fetchedAt < PUZZLES_TTL_MS) {
      return cached.puzzles;
    }

    try {
      const params = new URLSearchParams();

      if (filters.themes && filters.themes.length > 0) {
        params.set("themes", filters.themes.join(","));
      }
      if (filters.minRating !== undefined) {
        params.set("minRating", String(filters.minRating));
      }
      if (filters.maxRating !== undefined) {
        params.set("maxRating", String(filters.maxRating));
      }
      if (filters.limit !== undefined) {
        params.set("limit", String(filters.limit));
      }

      const res = await fetch(`/api/puzzles?${params.toString()}`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as Record<string, unknown>).message as string || "Failed to fetch puzzles.");
      }

      const json: GetPuzzlesResponse = await res.json();
      const puzzles = json.data?.puzzles ?? [];

      // Store in cache
      puzzlesCache.set(cacheKey, { puzzles, fetchedAt: now });

      return puzzles;
    } catch (error: unknown) {
      console.error("[PuzzleApiService.getPuzzles] Error:", error);
      rollbar.error(error instanceof Error ? error : new Error(String(error)), { context: "PuzzleApiService.getPuzzles", filters });
      // Return stale cache on error rather than empty, if available
      return cached?.puzzles ?? [];
    }
  }
}
