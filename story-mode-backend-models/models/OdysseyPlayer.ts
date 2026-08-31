import type { OdysseyMap } from "./OdysseyMap.js";
import type { OdysseyRelic } from "./OdysseyRelic.js";
import type { ERelicType } from "../enums/ERelicType.js";

/**
 * One save slot's run state. No persistence methods live here — per the
 * owner's instruction, the Repository layer that would own database
 * access is deliberately out of scope for this pass. Everything below is
 * pure domain logic operating on already-loaded fields.
 */
export class OdysseyPlayer {
  id!: string;
  userId!: string;
  slotId!: number; // 1 | 2 | 3

  map!: OdysseyMap; // this slot's generated run map

  coins!: number; // default 50
  relics!: OdysseyRelic[]; // max 5 distinct entries — replaces the old parallel relics[]/`${type}Charges` fields

  completedNodes!: number[];
  currentNodeId!: number; // -1 = none
  journeyComplete!: boolean;

  playtimeSeconds!: number; // NOTE: dead field on the frontend today — never incremented anywhere
  selectedCharacterId!: string | null; // NEW — not persisted anywhere in the current frontend
  updatedAt!: Date;

  // ── relic inventory (used by Battle / Merchant / RestSite) ─────────────

  getRelic(type: ERelicType): OdysseyRelic | undefined {
    throw new Error("Not implemented");
  }

  ownsRelic(type: ERelicType): boolean {
    throw new Error("Not implemented");
  }

  hasCharge(type: ERelicType): boolean {
    throw new Error("Not implemented"); // this.getRelic(type)?.hasCharge() ?? false
  }

  hasFreeRelicSlot(): boolean {
    throw new Error("Not implemented"); // relics.length < MAX_RELIC_CHARGES
  }

  /** Adds a relic instance. No-op if a relic of the same type is already owned. */
  addRelic(relic: OdysseyRelic): void {
    throw new Error("Not implemented");
  }

  /** Removes the relic of `type`, if owned (used by OdysseyMerchant.sell). */
  removeRelic(type: ERelicType): void {
    throw new Error("Not implemented");
  }

  // ── economy ──────────────────────────────────────────────────────────

  /** coins = max(0, coins + amount). Supports negative amounts (spending). */
  addCoins(amount: number): void {
    throw new Error("Not implemented");
  }

  // ── map / progress rules (encapsulated here instead of re-checked by callers) ──

  /** Delegates to this.map.getNodeStatus(nodeId, this) === Available | Active. */
  canEnterNode(nodeId: number): boolean {
    throw new Error("Not implemented");
  }

  /** Appends nodeId to completedNodes (idempotent); sets journeyComplete if the node was the boss. */
  completeNode(nodeId: number, wasBossNode: boolean): void {
    throw new Error("Not implemented");
  }

  /** journeyComplete ? 100 : round(completedNodes.length / MAX_PATH_LENGTH * 100) */
  calculateProgressPercent(): number {
    throw new Error("Not implemented");
  }

  /**
   * keepProgress=true ("New Game+"): keeps coins/relics/playtime, clears
   * completedNodes, currentNodeId=-1, journeyComplete=false, regenerates map.
   * keepProgress=false ("Fresh Start" / abandon-run): resets every field
   * to defaults and regenerates map.
   */
  reset(keepProgress: boolean): void {
    throw new Error("Not implemented");
  }
}
