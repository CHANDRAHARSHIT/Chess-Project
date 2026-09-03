/**
 * useOpenings.ts
 *
 * Thin React hook that wraps OpeningService.getAllOpenings().
 *
 * On the very first render it synchronously checks localStorage for a valid
 * cached entry and seeds the initial state with it, so the component can start
 * rendering the list before any async work completes.  If the persistent cache
 * is present and valid, `isLoading` is set to false immediately and no spinner
 * is shown.
 *
 * Features:
 *   - Synchronous initial state from localStorage (no spinner on refresh)
 *   - Falls through to the network when the cache is absent or expired
 *   - `refresh()` invalidates both cache layers and re-fetches immediately
 *   - Cancelled-flag guard prevents state updates on unmounted components
 *
 * Usage:
 *   const { openings, isLoading, error, refresh } = useOpenings();
 */

import { useState, useEffect, useCallback } from "react";
import { OpeningService } from "@/services/openings-openings.service";
import type { Opening } from "@/types/openings-openings.types";

const STORAGE_KEY = "xlchess_openings_cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Read the persistent cache synchronously and return its openings, or null. */
function readStorageSync(): Opening[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!Array.isArray(entry?.openings) || typeof entry?.cachedAt !== "number") return null;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return null;
    return entry.openings as Opening[];
  } catch {
    return null;
  }
}

export interface UseOpeningsResult {
  /** Full dataset, sourced from cache or the API. */
  openings: Opening[];
  /**
   * True only when a network request is in-flight AND there is no cached data
   * to show yet.  False immediately if localStorage has a valid entry.
   */
  isLoading: boolean;
  /** Human-readable error message, or null. */
  error: string | null;
  /**
   * Invalidates both cache layers and triggers a fresh API fetch.
   * Call this after any create / update / delete mutation.
   */
  refresh: () => void;
}

export function useOpenings(): UseOpeningsResult {
  // Seed state from localStorage synchronously so there is no flash of empty
  // content on a page refresh when a valid cache entry exists.
  const cached = readStorageSync();

  const [openings, setOpenings] = useState<Opening[]>(cached ?? []);
  // If we already have cached data, skip the loading state entirely.
  const [isLoading, setIsLoading] = useState(cached === null);
  const [error, setError] = useState<string | null>(null);
  // Increment to re-trigger the fetch effect without stale closure issues.
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // If the cache already seeded valid data on this render cycle, we still
    // call getAllOpenings() so the service's in-memory layer is populated, but
    // we skip showing a loading indicator because we already have content.
    const hasSeedData = openings.length > 0;
    if (!hasSeedData) setIsLoading(true);
    setError(null);

    OpeningService.getAllOpenings()
      .then((data) => {
        if (!cancelled) {
          setOpenings(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load openings. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // fetchKey is the only intentional re-trigger; openings.length is stable after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey]);

  /**
   * Invalidate both cache layers and re-fetch.
   * Wire this up wherever a mutation (add / edit / delete) occurs.
   */
  const refresh = useCallback(() => {
    OpeningService.invalidateCache();
    setFetchKey((k) => k + 1);
  }, []);

  return { openings, isLoading, error, refresh };
}
