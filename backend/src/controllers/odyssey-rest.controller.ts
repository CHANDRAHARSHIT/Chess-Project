import type { Request, Response, NextFunction } from "express";
import { OdysseyRestService, type OdysseyRestOutcomePayload } from "../services/odyssey-rest.service.js";
import { ERelicType } from "../models/odyssey/enums/ERelicType.js";
import { requireUserAndSlotId, requireNodeId, requireExistingSlot } from "./odysseyControllerSupport.js";

const VALID_RELIC_TYPES: string[] = Object.values(ERelicType);

function isOutcomePayload(value: unknown): value is OdysseyRestOutcomePayload {
  if (!value || typeof value !== "object") return false;
  const outcome = value as Record<string, unknown>;

  if (typeof outcome.restores !== "object" || outcome.restores === null) return false;
  for (const [type, points] of Object.entries(outcome.restores as Record<string, unknown>)) {
    if (!VALID_RELIC_TYPES.includes(type) || typeof points !== "number") return false;
  }

  const validFoundCoins = outcome.foundCoins === null || typeof outcome.foundCoins === "number";
  const validFoundRelic = outcome.foundRelic === null || (typeof outcome.foundRelic === "string" && VALID_RELIC_TYPES.includes(outcome.foundRelic));
  return validFoundCoins && validFoundRelic;
}

export class OdysseyRestController {
  /**
   * POST /api/odyssey/slots/:slotId/nodes/:nodeId/rest
   * Enters a rest node and rolls its (unapplied) restore/discovery outcome.
   */
  static async enterRest(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const nodeId = requireNodeId(req, res);
      if (nodeId === undefined) return;

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const result = await OdysseyRestService.enterRest(guard.userId, guard.slotId, nodeId);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/odyssey/slots/:slotId/nodes/:nodeId/rest/apply
   * Body: { outcome: OdysseyRestOutcomePayload } — resent exactly as returned by enterRest.
   */
  static async applyRest(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const nodeId = requireNodeId(req, res);
      if (nodeId === undefined) return;

      const { outcome } = req.body;
      if (!isOutcomePayload(outcome)) {
        return res.status(400).json({ status: "fail", message: "A valid rest outcome must be provided." });
      }

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const game = await OdysseyRestService.applyRest(guard.userId, guard.slotId, nodeId, outcome);
      res.status(200).json({ status: "success", data: { game } });
    } catch (error) {
      next(error);
    }
  }
}
