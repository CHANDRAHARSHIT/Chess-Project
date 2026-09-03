import { OdysseyMap, MAX_PATH_LENGTH } from "./OdysseyMap.js";
import { NO_CURRENT_NODE_ID } from "./OdysseyNode.js";
import { MAX_RELIC_CHARGES } from "./OdysseyRelic.js";
import { ERelicType } from "../enums/ERelicType.js";
import { ENodeStatus } from "../enums/ENodeStatus.js";
import type { OdysseyRelic } from "./OdysseyRelic.js";
import type { OdysseyPlayer } from "./OdysseyPlayer.js";

const DEFAULT_COINS = 50;
const MIN_COINS = 0;
const MAX_PROGRESS_PERCENT = 100;
const RESET_PLAYTIME_SECONDS = 0;

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

  coins!: number; // default DEFAULT_COINS
  relics!: OdysseyRelic[]; // max MAX_RELIC_CHARGES distinct entries — replaces the old parallel relics[]/`${type}Charges` fields

  completedNodes!: number[];
  currentNodeId!: number; // NO_CURRENT_NODE_ID = none
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

  /**
   * Whether this game could take on a relic of `type` — either it's
   * already owned (so acquiring more just tops up charges) or there's a
   * free inventory slot for a new one. Named so this compound rule has
   * one source of truth instead of being re-derived (owned-check plus
   * slot-check) at each call site that grants relics.
   */
  canAcquireRelic(type: ERelicType): boolean {
    return this.ownsRelic(type) || this.hasFreeRelicSlot();
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

  /** coins = max(MIN_COINS, coins + amount). Supports negative amounts (spending). */
  addCoins(amount: number): void {
    this.coins = Math.max(MIN_COINS, this.coins + amount);
  }

  /** Whether this game's coin balance covers `amount`. */
  canAfford(amount: number): boolean {
    return this.coins >= amount;
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

  /** journeyComplete ? MAX_PROGRESS_PERCENT : round(completedNodes.length / MAX_PATH_LENGTH * MAX_PROGRESS_PERCENT) */
  calculateProgressPercent(): number {
    if (this.journeyComplete) {
      return MAX_PROGRESS_PERCENT;
    }
    return Math.min(MAX_PROGRESS_PERCENT, Math.round((this.completedNodes.length / MAX_PATH_LENGTH) * MAX_PROGRESS_PERCENT));
  }

  /**
   * keepProgress=true ("New Game+"): keeps coins/relics/playtime/player,
   * clears completedNodes, currentNodeId=NO_CURRENT_NODE_ID, journeyComplete=false,
   * regenerates map.
   * keepProgress=false ("Fresh Start" / abandon-run): resets every field
   * to defaults (including clearing the chosen player, who must be
   * re-selected) and regenerates map.
   */
  reset(keepProgress: boolean): void {
    this.completedNodes = [];
    this.currentNodeId = NO_CURRENT_NODE_ID;
    this.journeyComplete = false;
    this.map = OdysseyMap.generate();

    if (!keepProgress) {
      this.coins = DEFAULT_COINS;
      this.relics = [];
      this.playtimeSeconds = RESET_PLAYTIME_SECONDS;
      this.player = null;
    }
  }
}
