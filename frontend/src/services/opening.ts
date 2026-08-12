/**
 * opening.ts (service)
 * Fetches chess opening data from the backend API.
 * Follows the same static-class pattern as PaymentService.
 *
 * ─── Caching strategy ──────────────────────────────────────────────────────
 *
 * Two layers of cache protect against slow loads:
 *
 *   1. In-memory cache  — lives for the lifetime of the current page session.
 *      Navigating away and back within the same tab is instant.
 *
 *   2. localStorage cache — survives a full browser refresh.
 *      On next page load the dataset is read synchronously from storage and
 *      returned immediately, so the UI never shows a loading spinner again
 *      until the TTL expires.
 *
 * TTL: 24 hours.  After expiry the next getAllOpenings() call fetches fresh
 * data, updates both layers, and resets the clock.
 *
 * Mutation helpers:
 *   invalidateCache()  — drops both cache layers; next read hits the network.
 *   refreshCache()     — fetches immediately and repopulates both layers.
 *
 * Storage key and schema:
 *   key:   "xlchess_openings_cache"
 *   value: { cachedAt: number, openings: Opening[] }
 */

import type { Opening, OpeningsListResponse, OpeningResponse } from "@/types/opening";
import rollbar from "@/config/rollbar";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "xlchess_openings_cache";
/** 24-hour TTL — openings data is essentially static so one refresh per day is plenty. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface StoredCache {
  cachedAt: number;
  openings: Opening[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class OpeningService {
  // ── Layer 1: In-memory ───────────────────────────────────────────────────

  private static _memCache: Opening[] | null = null;

  // ── Layer 2: localStorage helpers ────────────────────────────────────────

  /** Read the persistent cache entry.  Returns null if absent, corrupt, or expired. */
  private static _readStorage(): Opening[] | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const entry: StoredCache = JSON.parse(raw);
      if (
        !entry ||
        !Array.isArray(entry.openings) ||
        typeof entry.cachedAt !== "number"
      ) {
        return null;
      }

      const isExpired = Date.now() - entry.cachedAt > CACHE_TTL_MS;
      if (isExpired) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return entry.openings;
    } catch {
      // JSON parse error or localStorage unavailable (private mode, quota exceeded, etc.)
      return null;
    }
  }

  /** Persist the dataset and timestamp to localStorage.  Silently no-ops on failure. */
  private static _writeStorage(openings: Opening[]): void {
    try {
      const entry: StoredCache = { cachedAt: Date.now(), openings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    } catch {
      // Storage quota exceeded or unavailable — in-memory cache still works.
      console.warn("[OpeningService] localStorage write failed; using in-memory cache only.");
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Returns all chess openings.
   *
   * Resolution order (fastest → slowest):
   *   1. In-memory cache  (same tab, no refresh)
   *   2. localStorage     (after a browser refresh — synchronous, ~instant)
   *   3. Network fetch    (first visit or after TTL expiry)
   */
  static async getAllOpenings(): Promise<Opening[]> {
    // Layer 1 — in-memory
    if (OpeningService._memCache !== null) {
      return OpeningService._memCache;
    }

    // Layer 2 — localStorage
    const stored = OpeningService._readStorage();
    if (stored !== null) {
      OpeningService._memCache = stored; // warm the memory layer too
      return stored;
    }

    // Layer 3 — network
    return OpeningService.refreshCache();
  }

  /**
   * Fetches fresh data from the API and repopulates both cache layers.
   *
   * On network error, falls back to the last known good value in whichever
   * layer is still available, so the UI stays functional.
   */
  static async refreshCache(): Promise<Opening[]> {
    try {
      const response = await fetch("/api/openings");
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch openings.");
      }
      const json: OpeningsListResponse = await response.json();
      const openings = json.data.openings;

      // Populate both layers
      OpeningService._memCache = openings;
      OpeningService._writeStorage(openings);

      return openings;
    } catch (error: unknown) {
      console.error("[OpeningService.refreshCache] Error:", error);
      // Falls back to the stale cache below, so this never reaches the
      // ErrorBoundary — report it manually.
      rollbar.error(error instanceof Error ? error : new Error(String(error)), { context: "OpeningService.refreshCache" });
      // Return whatever is still in memory/storage rather than an empty list
      return OpeningService._memCache ?? OpeningService._readStorage() ?? [];
    }
  }

  /**
   * Drops both cache layers so the next getAllOpenings() call hits the network.
   *
   * Call this after any mutation (add / edit / delete opening) to ensure
   * consumers see fresh data on their next request.
   */
  static invalidateCache(): void {
    OpeningService._memCache = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  // ── Single-opening endpoint ───────────────────────────────────────────────

  /**
   * Fetches a single opening by its database ID.
   */
  static async getOpeningById(id: string): Promise<Opening | null> {
    try {
      const response = await fetch(`/api/openings/${id}`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch opening.");
      }
      const json: OpeningResponse = await response.json();
      return json.data.opening;
    } catch (error: unknown) {
      console.error("[OpeningService.getOpeningById] Error:", error);
      rollbar.error(error instanceof Error ? error : new Error(String(error)), { context: "OpeningService.getOpeningById", id });
      return null;
    }
  }
}
