import { OdysseyItem } from "./OdysseyItem.js";
import { ERelicType } from "../enums/ERelicType.js";

export const MAX_RELIC_CHARGES = 5; // cap per relic's charge count, and cap on distinct relics a player can carry

/**
 * A relic the player equips and spends charges of. Charge count now lives
 * ON the relic instance instead of a parallel `${type}Charges` field on
 * the player (StoryModeContext's RunState) — see OdysseyPlayer for why
 * that also retires the old "using a charge silently un-equips the relic"
 * behavior: there's no separate relics[]/charges pairing left to desync.
 */
export abstract class OdysseyRelic extends OdysseyItem {
  readonly type: ERelicType;
  charges: number; // 0..MAX_RELIC_CHARGES

  protected constructor(type: ERelicType, name: string, description: string, charges = 0) {
    super(`relic-${type}`, name, description);
    throw new Error("Not implemented"); // would assign type/charges and validate charges in [0, MAX_RELIC_CHARGES]
  }

  hasCharge(): boolean {
    throw new Error("Not implemented");
  }

  /** Spends one charge. Returns false if none remain. */
  consume(): boolean {
    throw new Error("Not implemented");
  }

  /**
   * Builds the right concrete subclass for a relic type — used by
   * OdysseyMerchant (granting a purchased relic) and OdysseyRestSite
   * (granting a discovered one) so neither has to switch on ERelicType
   * itself.
   */
  static create(type: ERelicType, charges = 0): OdysseyRelic {
    throw new Error("Not implemented");
  }
}
