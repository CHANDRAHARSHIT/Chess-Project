import type { Request, Response, NextFunction } from "express";
import { OdysseyMerchantService } from "../services/odyssey-merchant.service.js";
import { ERelicType } from "../models/odyssey/enums/ERelicType.js";
import { requireUserAndSlotId, requireNodeId, requireExistingSlot } from "./odysseyControllerSupport.js";

const VALID_RELIC_TYPES: string[] = Object.values(ERelicType);

export class OdysseyMerchantController {
  /**
   * POST /api/odyssey/slots/:slotId/nodes/:nodeId/merchant
   * Enters a merchant node and rolls its priced catalog + 3 offerings.
   */
  static async openShop(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const nodeId = requireNodeId(req, res);
      if (nodeId === undefined) return;

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const result = await OdysseyMerchantService.openShop(guard.userId, guard.slotId, nodeId);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/odyssey/slots/:slotId/nodes/:nodeId/merchant/purchase
   * Body: { relicType: ERelicType, quantity: number }
   * Price is derived server-side from (run, node, relicType) — the client
   * names what it wants, not what it costs.
   */
  static async purchase(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const nodeId = requireNodeId(req, res);
      if (nodeId === undefined) return;

      const { relicType, quantity } = req.body;
      if (typeof relicType !== "string" || !VALID_RELIC_TYPES.includes(relicType)) {
        return res.status(400).json({ status: "fail", message: `relicType must be one of: ${VALID_RELIC_TYPES.join(", ")}.` });
      }
      if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ status: "fail", message: "quantity must be a positive integer." });
      }

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const game = await OdysseyMerchantService.purchase(guard.userId, guard.slotId, nodeId, relicType as ERelicType, quantity);
      res.status(200).json({ status: "success", data: { game } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/odyssey/slots/:slotId/merchant/sell
   * Body: { relicType: ERelicType }
   */
  static async sell(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const { relicType } = req.body;
      if (typeof relicType !== "string" || !VALID_RELIC_TYPES.includes(relicType)) {
        return res.status(400).json({ status: "fail", message: `relicType must be one of: ${VALID_RELIC_TYPES.join(", ")}.` });
      }

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const result = await OdysseyMerchantService.sell(guard.userId, guard.slotId, relicType as ERelicType);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/odyssey/slots/:slotId/nodes/:nodeId/merchant/reroll
   * Spends a Reroll charge to re-select 3 offerings from that node's
   * (unchanged, deterministic) catalog. No body needed — the server already
   * knows the catalog from (run, node).
   */
  static async reroll(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const nodeId = requireNodeId(req, res);
      if (nodeId === undefined) return;

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const result = await OdysseyMerchantService.reroll(guard.userId, guard.slotId, nodeId);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/odyssey/slots/:slotId/nodes/:nodeId/merchant/leave
   * Marks the merchant node completed.
   */
  static async leaveShop(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const nodeId = requireNodeId(req, res);
      if (nodeId === undefined) return;

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const game = await OdysseyMerchantService.leaveShop(guard.userId, guard.slotId, nodeId);
      res.status(200).json({ status: "success", data: { game } });
    } catch (error) {
      next(error);
    }
  }
}
