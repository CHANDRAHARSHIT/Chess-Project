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

export interface OdysseyBackendGame {
  id: string;
  coins: number;
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

export interface OdysseyShopItemPayload {
  relicType: OdysseyRelicType;
  costPerCharge: number;
}

export interface OdysseyRestOutcomePayload {
  restores: Partial<Record<OdysseyRelicType, number>>;
  foundCoins: number | null;
  foundRelic: OdysseyRelicType | null;
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

  static async merchantPurchase(slotId: number, item: OdysseyShopItemPayload, quantity: number): Promise<boolean> {
    return post(`/slots/${slotId}/merchant/purchase`, "merchantPurchase", { item, quantity });
  }

  static async merchantSell(slotId: number, relicType: OdysseyRelicType): Promise<boolean> {
    return post(`/slots/${slotId}/merchant/sell`, "merchantSell", { relicType });
  }

  static async merchantReroll(slotId: number, catalog: OdysseyShopItemPayload[]): Promise<boolean> {
    return post(`/slots/${slotId}/merchant/reroll`, "merchantReroll", { catalog });
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
