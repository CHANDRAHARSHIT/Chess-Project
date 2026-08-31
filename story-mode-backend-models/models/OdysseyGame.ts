import { OdysseyMap, MAX_PATH_LENGTH } from "./OdysseyMap.js";
import { MAX_RELIC_CHARGES } from "./OdysseyRelic.js";
import { ERelicType } from "../enums/ERelicType.js";
import { ENodeStatus } from "../enums/ENodeStatus.js";
import type { OdysseyRelic } from "./OdysseyRelic.js";
import type { OdysseyPlayer } from "./OdysseyPlayer.js";

const DEFAULT_COINS = 50;

/**
 * The state of a single Odyssey run — one save slot. Tracks which
 * OdysseyPlayer is playing, the generated OdysseyMap, the run's economy
 * (coins/relics), and progress through the map. No persistence methods
 * live here — everything below is pure domain logic operating on
 * already-loaded fields.
 */
export class OdysseyGame {
  id!: string;
  userId!: string;
  slotId!: number; // 1 | 2 | 3

  player!: OdysseyPlayer | null; // the chosen character; null until picked at the start node
  map!: OdysseyMap; // this slot's generated run map

  coins!: number; // default 50
  relics!: OdysseyRelic[]; // max 5 distinct entries — replaces the old parallel relics[]/`${type}Charges` fields

  completedNodes!: number[];
  currentNodeId!: number; // -1 = none
  journeyComplete!: boolean;

  playtimeSeconds!: number; // NOTE: dead field on the frontend today — never incremented anywhere
  updatedAt!: Date;

  // ── relic inventory (used by Battle / Merchant / RestSite) ─────────────

  getRelic(type: ERelicType): OdysseyRelic | undefined {
    return this.relics.find(relic => relic.type === type);
  }

  ownsRelic(type: ERelicType): boolean {
    return this.getRelic(type) !== undefined;
  }

  hasCharge(type: ERelicType): boolean {
    return this.getRelic(type)?.hasCharge() ?? false;
  }

  hasFreeRelicSlot(): boolean {
    return this.relics.length < MAX_RELIC_CHARGES;
  }

  /** Adds a relic instance. No-op if a relic of the same type is already owned. */
  addRelic(relic: OdysseyRelic): void {
    if (this.ownsRelic(relic.type)) {
      return;
    }
    this.relics.push(relic);
  }

  /** Removes the relic of `type`, if owned (used by OdysseyMerchant.sell). */
  removeRelic(type: ERelicType): void {
    this.relics = this.relics.filter(relic => relic.type !== type);
  }

  // ── economy ──────────────────────────────────────────────────────────

  /** coins = max(0, coins + amount). Supports negative amounts (spending). */
  addCoins(amount: number): void {
    this.coins = Math.max(0, this.coins + amount);
  }

  // ── map / progress rules (encapsulated here instead of re-checked by callers) ──

  /** Delegates to this.map.getNodeStatus(nodeId, this) === Available | Active. */
  canEnterNode(nodeId: number): boolean {
    const status = this.map.getNodeStatus(nodeId, this);
    return status === ENodeStatus.Available || status === ENodeStatus.Active;
  }

  /** Appends nodeId to completedNodes (idempotent); sets journeyComplete if the node was the boss. */
  completeNode(nodeId: number, wasBossNode: boolean): void {
    if (!this.completedNodes.includes(nodeId)) {
      this.completedNodes.push(nodeId);
    }
    if (wasBossNode) {
      this.journeyComplete = true;
    }
  }

  /** journeyComplete ? 100 : round(completedNodes.length / MAX_PATH_LENGTH * 100) */
  calculateProgressPercent(): number {
    if (this.journeyComplete) {
      return 100;
    }
    return Math.min(100, Math.round((this.completedNodes.length / MAX_PATH_LENGTH) * 100));
  }

  /**
   * keepProgress=true ("New Game+"): keeps coins/relics/playtime/player,
   * clears completedNodes, currentNodeId=-1, journeyComplete=false,
   * regenerates map.
   * keepProgress=false ("Fresh Start" / abandon-run): resets every field
   * to defaults (including clearing the chosen player, who must be
   * re-selected) and regenerates map.
   */
  reset(keepProgress: boolean): void {
    this.completedNodes = [];
    this.currentNodeId = -1;
    this.journeyComplete = false;
    this.map = OdysseyMap.generate();

    if (!keepProgress) {
      this.coins = DEFAULT_COINS;
      this.relics = [];
      this.playtimeSeconds = 0;
      this.player = null;
    }
  }
}
