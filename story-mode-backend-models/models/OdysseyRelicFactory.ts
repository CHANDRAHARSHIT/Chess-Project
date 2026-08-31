import { ERelicType } from "../enums/ERelicType.js";
import { OdysseyRelic } from "./OdysseyRelic.js";
import { OdysseyUndoRelic } from "./OdysseyUndoRelic.js";
import { OdysseyHintRelic } from "./OdysseyHintRelic.js";
import { OdysseyEvalBarRelic } from "./OdysseyEvalBarRelic.js";
import { OdysseyTimeRelic } from "./OdysseyTimeRelic.js";
import { OdysseyRerollRelic } from "./OdysseyRerollRelic.js";

/**
 * Builds the right concrete OdysseyRelic subclass for a relic type — used
 * by OdysseyMerchant (granting a purchased relic) and OdysseyRestSite
 * (granting a discovered one) so neither has to switch on ERelicType itself.
 *
 * Lives in its own file rather than as a static method on OdysseyRelic to
 * avoid a circular import: the abstract base would otherwise need to
 * import every concrete subclass, each of which imports the base back
 * through OdysseyBattleRelic / OdysseyShopRelic.
 */
export class OdysseyRelicFactory {
  static create(type: ERelicType, charges = 0): OdysseyRelic {
    switch (type) {
      case ERelicType.Undo:
        return new OdysseyUndoRelic(charges);
      case ERelicType.Hint:
        return new OdysseyHintRelic(charges);
      case ERelicType.EvalBar:
        return new OdysseyEvalBarRelic(charges);
      case ERelicType.Time:
        return new OdysseyTimeRelic(charges);
      case ERelicType.Reroll:
        return new OdysseyRerollRelic(charges);
      default: {
        const exhaustive: never = type;
        throw new Error(`Unknown relic type: ${exhaustive}`);
      }
    }
  }
}
