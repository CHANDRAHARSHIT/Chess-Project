import rollbar from "@/shared/lib/rollbar";

const BASE_URL = "/api/odyssey";

export type OdysseyPlayerType = "strategist" | "knight" | "bishop" | "rook";

function reportFailure(context: string, error: unknown) {
  console.error(`[OdysseyApiService] ${context}:`, error);
  rollbar.error(error instanceof Error ? error : new Error(String(error)), { context: `OdysseyApiService.${context}` });
}

/**
 * Client-side sync with the real Odyssey backend, covering the run's
 * lifecycle only (create/select-character/reset/delete a save slot).
 * Local React state + localStorage (see StoryModeContext) remains the
 * authoritative source for gameplay today — completedNodes/coins/relics
 * aren't synced yet, since the gameplay screens (Battle/Merchant/Rest/
 * Puzzle) that grant them haven't been wired to the backend. Every call
 * silently no-ops on failure, matching PathwayProgressApiService's
 * established best-effort pattern in this codebase.
 */
export class OdysseyApiService {
  /** Whether a run already exists for this slot on the backend. */
  static async slotExists(slotId: number): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/slots/${slotId}`, { credentials: "include" });
      return res.ok;
    } catch (error: unknown) {
      reportFailure("slotExists", error);
      return false;
    }
  }

  static async startNewRun(slotId: number): Promise<boolean> {
    return post(`/slots/${slotId}/start`, "startNewRun");
  }

  static async selectCharacter(slotId: number, type: OdysseyPlayerType): Promise<boolean> {
    return post(`/slots/${slotId}/character`, "selectCharacter", { type });
  }

  static async resetRun(slotId: number, keepProgress: boolean): Promise<boolean> {
    return post(`/slots/${slotId}/reset`, "resetRun", { keepProgress });
  }

  static async deleteSlot(slotId: number): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/slots/${slotId}`, { method: "DELETE", credentials: "include" });
      return res.ok;
    } catch (error: unknown) {
      reportFailure("deleteSlot", error);
      return false;
    }
  }
}

async function post(path: string, context: string, body?: unknown): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn(`[OdysseyApiService] ${context} failed:`, err);
      return false;
    }
    return true;
  } catch (error: unknown) {
    reportFailure(context, error);
    return false;
  }
}
