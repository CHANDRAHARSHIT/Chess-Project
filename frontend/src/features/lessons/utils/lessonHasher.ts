import type { SegmentData, SlideData } from "../components/types";

/**
 * Normalizes persisted lesson data (excluding UI state like selection, cursor, active tab, zoom, etc.)
 * and generates a deterministic hash string for fast snapshot comparison.
 */
export function computeLessonSnapshotHash(
  title: string,
  status: string,
  segments: SegmentData[]
): string {
  const normalized = {
    title: (title || "").trim(),
    status: (status || "DRAFT").trim(),
    segments: (segments || []).map((seg) => ({
      title: (seg.title || "").trim(),
      slides: (seg.slides || []).map((sl: SlideData) => ({
        title: (sl.title || "").trim(),
        coachText: (sl.content || "").trim(),
        hasBoard: Boolean(sl.hasBoard),
        fen: sl.hasBoard ? (sl.fen || "").trim() : "",
        annotations: sl.annotations || {},
      })),
    })),
  };

  const jsonString = JSON.stringify(normalized);
  return fastHashString(jsonString);
}

/**
 * Fast 32-bit FNV-1a string hashing function.
 * Produces a lightweight, deterministic hex string in under 0.1ms.
 */
function fastHashString(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}
