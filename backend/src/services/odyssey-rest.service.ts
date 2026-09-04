import { OdysseyGameRepository } from "../repositories/OdysseyGameRepository.js";
import { OdysseyGameService } from "./odyssey-game.service.js";
import { OdysseyRestSite } from "../models/odyssey/models/OdysseyRestSite.js";
import type { OdysseyGame } from "../models/odyssey/models/OdysseyGame.js";
import type { ERelicType } from "../models/odyssey/enums/ERelicType.js";

/** An OdysseyRestSite's rolled outcome, serialized (the roll itself isn't persisted until applied). */
export interface OdysseyRestOutcomePayload {
  restores: Partial<Record<ERelicType, number>>;
  foundCoins: number | null;
  foundRelic: ERelicType | null;
}

export class OdysseyRestService {
  /** Enters a rest node and rolls its (unapplied) restore/discovery outcome. */
  static async enterRest(userId: string, slotId: number, nodeId: number): Promise<{ game: OdysseyGame; outcome: OdysseyRestSite }> {
    const game = await OdysseyGameService.enterNode(userId, slotId, nodeId);
    const outcome = OdysseyRestSite.roll(game);
    return { game, outcome };
  }

  /**
   * Applies a previously-rolled outcome and completes the node. The caller
   * resends exactly what enterRest gave it — the roll itself isn't stored
   * server-side, matching the frontend (rolled once on mount, applied on
   * the "Rest" button click, never persisted in between).
   */
  static async applyRest(userId: string, slotId: number, nodeId: number, outcome: OdysseyRestOutcomePayload): Promise<OdysseyGame> {
    const game = await OdysseyGameService.requireSlot(userId, slotId);
    if (!game.canEnterNode(nodeId)) {
      throw new Error(`Node ${nodeId} is not currently reachable for this run — refusing to resolve it.`);
    }
    const site = new OdysseyRestSite();
    site.restores = outcome.restores;
    site.foundCoins = outcome.foundCoins;
    site.foundRelic = outcome.foundRelic;
    site.applyTo(game);
    game.completeNode(nodeId, false); // a rest node is never the boss
    return OdysseyGameRepository.upsert(game);
  }
}
