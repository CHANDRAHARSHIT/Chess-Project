import { OdysseyItem } from "./OdysseyItem.js";
import { ERelicType } from "../enums/ERelicType.js";

export const MAX_RELIC_CHARGES = 5; // cap per relic's charge count, and cap on distinct relics a run can carry

/**
 * A relic a run equips and spends charges of. Charge count now lives ON
 * the relic instance instead of a parallel `${type}Charges` field on the
 * run (StoryModeContext's RunState) — see OdysseyGame for why that also
 * retires the old "using a charge silently un-equips the relic" behavior:
 * there's no separate relics[]/charges pairing left to desync.
 *
 * Building a relic instance for a given ERelicType is done via
 * OdysseyRelicFactory, not a static method here — putting `create()` on
 * this base class would require it to import every concrete subclass,
 * each of which imports this class back (via OdysseyBattleRelic /
 * OdysseyShopRelic), producing a circular module dependency.
 */
export abstract class OdysseyRelic extends OdysseyItem {
  readonly type: ERelicType;
  charges: number; // 0..MAX_RELIC_CHARGES

  protected constructor(type: ERelicType, name: string, description: string, charges = 0) {
    super(`relic-${type}`, name, description);
    if (charges < 0 || charges > MAX_RELIC_CHARGES) {
      throw new RangeError(`charges must be between 0 and ${MAX_RELIC_CHARGES}, got ${charges}`);
    }
    this.type = type;
    this.charges = charges;
  }

  hasCharge(): boolean {
    return this.charges > 0;
  }

  /** Spends one charge. Returns false if none remain. */
  consume(): boolean {
    if (!this.hasCharge()) {
      return false;
    }
    this.charges -= 1;
    return true;
  }
}
