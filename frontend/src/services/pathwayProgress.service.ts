import rollbar from "@/config/rollbar";

export interface PathwayProgressData {
  completedIds: string[];
  streak: number;
  totalSolved: number;
}

/**
 * PathwayProgressApiService
 * -------------------------
 * Client-side service for reading/writing pathway puzzle progress via the backend API.
 * Both endpoints require an authenticated session cookie.
 */
export class PathwayProgressApiService {
  /**
   * Fetch the current user's pathway progress from the database.
   * Returns null if the request fails (e.g. unauthenticated, network error).
   */
  static async get(): Promise<PathwayProgressData | null> {
    try {
      const res = await fetch("/api/pathway-progress", {
        credentials: "include",
      });

      if (!res.ok) return null;

      const json = await res.json();
      return json.data as PathwayProgressData;
    } catch (error: unknown) {
      console.error("[PathwayProgressApiService.get] Error:", error);
      rollbar.error(error instanceof Error ? error : new Error(String(error)), { context: "PathwayProgressApiService.get" });
      return null;
    }
  }

  /**
   * Persist the current user's pathway progress to the database.
   * Silently no-ops on failure — localStorage is already updated by the hook.
   */
  static async save(data: PathwayProgressData): Promise<void> {
    try {
      const res = await fetch("/api/pathway-progress", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn("[PathwayProgressApiService.save] Failed:", err);
      }
    } catch (error: unknown) {
      console.error("[PathwayProgressApiService.save] Error:", error);
      rollbar.error(error instanceof Error ? error : new Error(String(error)), { context: "PathwayProgressApiService.save" });
    }
  }
}
