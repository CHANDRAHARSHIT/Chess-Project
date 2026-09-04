import rollbar from "@/shared/lib/rollbar";

const BASE_URL = "/api/odyssey";

export type OdysseyPlayerType = "strategist" | "knight" | "bishop" | "rook";
export type OdysseyBattleEndReason = "checkmate" | "timeout" | "draw";

export interface OdysseyBackendMapNode {
  id: number;
  type: string; // ENodeType value, e.g. "start" | "enemy" | "elite" | "boss" | "puzzle" | "rest" | "merchant"
  label: string;
  x: number;
  y: number;
  edges: number[];
  description: string;
  difficulty?: number; // only present on battle/puzzle nodes
}

export interface OdysseyBackendRelic {
  type: string; // ERelicType value
  charges: number;
}

export interface OdysseyBackendGame {
  id: string;
  coins: number;
  relics: OdysseyBackendRelic[];
  completedNodes: number[];
  currentNodeId: number;
  journeyComplete: boolean;
  map: { nodes: OdysseyBackendMapNode[] };
}

export interface OdysseyBattleSnapshotPayload {
  playerInitialSeconds: number;
  enemyInitialSeconds: number;
  playerSeconds: number;
  enemySeconds: number;
  evalMovesRemaining: number;
  botConditions: { confused: number; relaxed: number; distracted: number };
}

// Matches ERelicType's string values exactly — no conversion needed against RelicType.
export type OdysseyRelicType = "undo" | "hint" | "evalBar" | "time" | "reroll";

export interface OdysseyRestOutcomePayload {
  restores: Partial<Record<OdysseyRelicType, number>>;
  foundCoins: number | null;
  foundRelic: OdysseyRelicType | null;
}

export interface OdysseySlotSummary {
  slotId: number;
  progressPercent: number;
  playtimeSeconds: number;
  updatedAt: string;
}

function reportFailure(context: string, error: unknown) {
  console.error(`[OdysseyApiService] ${context}:`, error);
  rollbar.error(error instanceof Error ? error : new Error(String(error)), { context: `OdysseyApiService.${context}` });
}

/**
 * Client-side sync with the real Odyssey backend. Local React state +
 * localStorage (see StoryModeContext) remains the authoritative source for
 * gameplay today — these calls keep the backend's copy of run facts
 * (slot existence, chosen character, map, battle outcomes) approximately
 * in sync, one node type at a time as each gameplay screen gets wired.
 * Every call silently no-ops on failure, matching PathwayProgressApiService's
 * established best-effort pattern in this codebase.
 */
export class OdysseyApiService {
  /**
   * Whether a run already exists for this slot on the backend. Retries on a
   * network-level failure before giving up — beginNewRun() treats a `false`
   * here as "safe to create a fresh run", so a transient failure wrongly
   * reported as `false` for a slot that actually has real progress would
   * wipe it via startNewRun. See getSlot's doc comment for the same pattern.
   */
  static async slotExists(slotId: number): Promise<boolean> {
    const attempts = 3;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const res = await fetch(`${BASE_URL}/slots/${slotId}`, { credentials: "include" });
        return res.ok;
      } catch (error: unknown) {
        if (attempt === attempts) {
          reportFailure("slotExists", error);
          return false;
        }
        await new Promise(resolve => setTimeout(resolve, 300 * attempt));
      }
    }
    return false;
  }

  /** Fetches a progress summary for every save slot (used by the slot picker), or null on failure. */
  static async getAllSlots(): Promise<OdysseySlotSummary[] | null> {
    try {
      const res = await fetch(`${BASE_URL}/slots`, { credentials: "include" });
      if (!res.ok) return null;
      const json = await res.json();
      return (json.data?.slots as OdysseySlotSummary[]) ?? null;
    } catch (error: unknown) {
      reportFailure("getAllSlots", error);
      return null;
    }
  }

  /**
   * Fetches the full run for a slot, or null if none exists on the backend.
   * Retries a couple of times on a network-level failure before giving up —
   * this is the one read StoryModeContext's load effect falls back to
   * localStorage without, and a transient failure here previously meant
   * silently showing a possibly-stale local map instead of the backend's
   * real one (see the map-mismatch bug this was built to prevent). A 4xx/5xx
   * response (slot genuinely doesn't exist, or a real server error) is NOT
   * retried — only a network-level failure (offline, dropped connection) is.
   */
  static async getSlot(slotId: number): Promise<OdysseyBackendGame | null> {
    const attempts = 3;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const res = await fetch(`${BASE_URL}/slots/${slotId}`, { credentials: "include" });
        if (!res.ok) return null;
        const json = await res.json();
        return (json.data?.game as OdysseyBackendGame) ?? null;
      } catch (error: unknown) {
        if (attempt === attempts) {
          reportFailure("getSlot", error);
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, 300 * attempt));
      }
    }
    return null;
  }

  static async startNewRun(slotId: number): Promise<OdysseyBackendGame | null> {
    return postForGame(`/slots/${slotId}/start`, "startNewRun");
  }

  static async selectCharacter(slotId: number, type: OdysseyPlayerType): Promise<boolean> {
    return post(`/slots/${slotId}/character`, "selectCharacter", { type });
  }

  static async resetRun(slotId: number, keepProgress: boolean): Promise<OdysseyBackendGame | null> {
    return postForGame(`/slots/${slotId}/reset`, "resetRun", { keepProgress });
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

  /** Records a battle's outcome (coins/node-completion) once it's decided locally. */
  static async resolveBattleOutcome(
    slotId: number,
    nodeId: number,
    snapshot: OdysseyBattleSnapshotPayload,
    endReason: OdysseyBattleEndReason,
    playerWon: boolean
  ): Promise<boolean> {
    return post(`/slots/${slotId}/nodes/${nodeId}/battle/resolve`, "resolveBattleOutcome", { snapshot, endReason, playerWon });
  }

  /**
   * Buys `quantity` charges of `relicType` at that node's true price. The
   * server derives the real price itself from (run, node, relicType) — this
   * call never sends a price at all, so there's nothing for a client to
   * spoof; whatever it charges is authoritative.
   */
  static async merchantPurchase(slotId: number, nodeId: number, relicType: OdysseyRelicType, quantity: number): Promise<boolean> {
    return post(`/slots/${slotId}/nodes/${nodeId}/merchant/purchase`, "merchantPurchase", { relicType, quantity });
  }

  static async merchantSell(slotId: number, relicType: OdysseyRelicType): Promise<boolean> {
    return post(`/slots/${slotId}/merchant/sell`, "merchantSell", { relicType });
  }

  /** Spends a Reroll charge for fresh offerings from that node's (server-known) catalog — no payload needed. */
  static async merchantReroll(slotId: number, nodeId: number): Promise<boolean> {
    return post(`/slots/${slotId}/nodes/${nodeId}/merchant/reroll`, "merchantReroll");
  }

  /** Marks the merchant node completed — call once the caller leaves the shop. */
  static async merchantLeaveShop(slotId: number, nodeId: number): Promise<boolean> {
    return post(`/slots/${slotId}/nodes/${nodeId}/merchant/leave`, "merchantLeaveShop");
  }

  /** Applies a rest site's outcome (already rolled locally) and marks the node completed. */
  static async applyRest(slotId: number, nodeId: number, outcome: OdysseyRestOutcomePayload): Promise<boolean> {
    return post(`/slots/${slotId}/nodes/${nodeId}/rest/apply`, "applyRest", { outcome });
  }

  /** Awards the all-or-nothing puzzle reward and completes the node on a full clear. */
  static async resolvePuzzle(slotId: number, nodeId: number, solvedCount: number, totalCount: number): Promise<boolean> {
    return post(`/slots/${slotId}/nodes/${nodeId}/puzzle/resolve`, "resolvePuzzle", { solvedCount, totalCount });
  }

  /** Marks a node as the run's current position. Requires the node to already be reachable per the backend's own completedNodes graph. */
  static async enterNode(slotId: number, nodeId: number): Promise<boolean> {
    return post(`/slots/${slotId}/nodes/${nodeId}/enter`, "enterNode");
  }

  /**
   * Marks a node completed directly, with no domain-specific reward — used
   * only for the Start node (id 0), which the frontend always renders as an
   * immediate battle but which isn't a real OdysseyBattleNode on the backend
   * (see odysseyMapConverter.ts), so resolveBattleOutcome can't cover it.
   */
  static async completeNode(slotId: number, nodeId: number): Promise<boolean> {
    return post(`/slots/${slotId}/nodes/${nodeId}/complete`, "completeNode");
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

async function postForGame(path: string, context: string, body?: unknown): Promise<OdysseyBackendGame | null> {
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
      return null;
    }
    const json = await res.json();
    return (json.data?.game as OdysseyBackendGame) ?? null;
  } catch (error: unknown) {
    reportFailure(context, error);
    return null;
  }
}
