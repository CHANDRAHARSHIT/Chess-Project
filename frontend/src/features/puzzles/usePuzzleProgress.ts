import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from '@/features/account/useSession';
import { PathwayProgressApiService } from '@/features/puzzles/pathwayProgress.service';

// ── localStorage keys (kept for guest fallback + fast-read cache) ──────────
const LS_COMPLETED = 'xlchess_completed_puzzles';
const LS_STREAK    = 'xlchess_puzzle_streak';
const LS_SOLVED    = 'xlchess_puzzle_solved';

// Write debounce (ms) — batches rapid solves into a single API call
const SAVE_DEBOUNCE_MS = 500;

// ── localStorage helpers ──────────────────────────────────────────────────
function lsReadCompleted(): string[] {
  try {
    const raw = localStorage.getItem(LS_COMPLETED);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

function lsReadInt(key: string): number {
  try { return parseInt(localStorage.getItem(key) || '0', 10) || 0; }
  catch { return 0; }
}

function lsWrite(completed: string[], streak: number, solved: number) {
  try { localStorage.setItem(LS_COMPLETED, JSON.stringify(completed)); } catch { /* quota */ }
  try { localStorage.setItem(LS_STREAK, streak.toString()); } catch { /* quota */ }
  try { localStorage.setItem(LS_SOLVED, solved.toString()); } catch { /* quota */ }
}

// ── Public interface ──────────────────────────────────────────────────────
export interface PuzzleProgressState {
  completedIds: string[];
  streak: number;
  solvedCount: number;
}

export interface UsePuzzleProgressReturn extends PuzzleProgressState {
  /** Call when a pathway puzzle is solved. */
  markSolved: (puzzleId: string) => void;
  /** Call when a pathway puzzle attempt fails (resets streak). */
  markFailed: () => void;
  /** True while the initial DB fetch is in flight. */
  isSyncing: boolean;
}

/**
 * usePuzzleProgress
 * -----------------
 * Manages pathway puzzle progress with a two-layer storage strategy:
 *
 *   Guest  → localStorage only  (current behaviour, no change)
 *   Logged in → DB primary, localStorage as fast-read cache
 *
 * Sync behaviour on mount:
 *   1. State is seeded from localStorage immediately (no flicker / loading state for guest).
 *   2. If authenticated, fetches progress from DB.
 *      - If DB has progress, it wins → state + localStorage are updated.
 *      - If DB has no record yet AND localStorage has data, the localStorage
 *        data is uploaded (guest-to-user migration on first login).
 *
 * Writes are debounced (500 ms) and only hit the API when authenticated.
 */
export function usePuzzleProgress(): UsePuzzleProgressReturn {
  const { session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && !!session?.user;

  // ── State — seeded from localStorage synchronously ───────────────────────
  const [completedIds, setCompletedIds] = useState<string[]>(lsReadCompleted);
  const [streak, setStreak]             = useState<number>(() => lsReadInt(LS_STREAK));
  const [solvedCount, setSolvedCount]   = useState<number>(() => lsReadInt(LS_SOLVED));
  const [isSyncing, setIsSyncing]       = useState(false);

  // Ref to hold the latest state values for the debounced save closure
  const latestRef = useRef({ completedIds, streak, solvedCount });
  useEffect(() => {
    latestRef.current = { completedIds, streak, solvedCount };
  }, [completedIds, streak, solvedCount]);

  // Debounce timer ref
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Debounced DB save ─────────────────────────────────────────────────────
  const scheduleSave = useCallback(() => {
    if (!isAuthenticated) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const { completedIds: ids, streak: s, solvedCount: tc } = latestRef.current;
      PathwayProgressApiService.save({ completedIds: ids, streak: s, totalSolved: tc });
    }, SAVE_DEBOUNCE_MS);
  }, [isAuthenticated]);

  // ── Initial DB sync (runs once when auth status resolves) ─────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    setIsSyncing(true);

    (async () => {
      const dbProgress = await PathwayProgressApiService.get();

      if (cancelled) return;
      setIsSyncing(false);

      if (!dbProgress) return; // network error — keep localStorage state

      const dbHasData = dbProgress.totalSolved > 0 || dbProgress.completedIds.length > 0;
      const lsHasData = latestRef.current.solvedCount > 0 || latestRef.current.completedIds.length > 0;

      if (dbHasData) {
        // DB wins — sync state and localStorage cache
        setCompletedIds(dbProgress.completedIds);
        setStreak(dbProgress.streak);
        setSolvedCount(dbProgress.totalSolved);
        lsWrite(dbProgress.completedIds, dbProgress.streak, dbProgress.totalSolved);
      } else if (lsHasData) {
        // First login with existing guest progress → upload to DB
        const { completedIds: ids, streak: s, solvedCount: tc } = latestRef.current;
        PathwayProgressApiService.save({ completedIds: ids, streak: s, totalSolved: tc });
        // Local state is already correct from the localStorage seed
      }
      // If neither has data, everything stays at zero — no-op
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated]);  

  // ── Mark Solved ──────────────────────────────────────────────────────────
  const markSolved = useCallback((puzzleId: string) => {
    setCompletedIds(prev => {
      if (prev.includes(puzzleId)) return prev;
      const updated = [...prev, puzzleId];
      lsWrite(updated, latestRef.current.streak + 1, latestRef.current.solvedCount + 1);
      return updated;
    });

    setStreak(prev => prev + 1);
    setSolvedCount(prev => prev + 1);

    scheduleSave();
  }, [scheduleSave]);

  // ── Mark Failed ──────────────────────────────────────────────────────────
  const markFailed = useCallback(() => {
    setStreak(0);
    try { localStorage.setItem(LS_STREAK, '0'); } catch { /* quota */ }
    scheduleSave();
  }, [scheduleSave]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return { completedIds, streak, solvedCount, markSolved, markFailed, isSyncing };
}
