import type { Request, Response, NextFunction } from "express";
import { OdysseyMerchantService, type OdysseyShopItemPayload } from "../services/odyssey-merchant.service.js";
import { ERelicType } from "../models/odyssey/enums/ERelicType.js";
import { requireUserAndSlotId, requireNodeId, requireExistingSlot } from "./odysseyControllerSupport.js";

const VALID_RELIC_TYPES: string[] = Object.values(ERelicType);

function isShopItemPayload(value: unknown): value is OdysseyShopItemPayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.relicType === "string" && VALID_RELIC_TYPES.includes(item.relicType) && typeof item.costPerCharge === "number";
}

export class OdysseyMerchantController {
  /**
   * POST /api/odyssey/slots/:slotId/nodes/:nodeId/merchant
   * Enters a merchant node and rolls a fresh priced catalog + 3 offerings.
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
   * POST /api/odyssey/slots/:slotId/merchant/purchase
   * Body: { item: { relicType: ERelicType, costPerCharge: number }, quantity: number }
   */
  static async purchase(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const { item, quantity } = req.body;
      if (!isShopItemPayload(item)) {
        return res.status(400).json({ status: "fail", message: "item must have a valid relicType and a numeric costPerCharge." });
      }
      if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ status: "fail", message: "quantity must be a positive integer." });
      }

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const game = await OdysseyMerchantService.purchase(guard.userId, guard.slotId, item, quantity);
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
   * POST /api/odyssey/slots/:slotId/merchant/reroll
   * Body: { catalog: { relicType: ERelicType, costPerCharge: number }[] }
   */
  static async reroll(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const { catalog } = req.body;
      if (!Array.isArray(catalog) || catalog.length === 0 || !catalog.every(isShopItemPayload)) {
        return res.status(400).json({ status: "fail", message: "catalog must be a non-empty array of shop items." });
      }

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const result = await OdysseyMerchantService.reroll(guard.userId, guard.slotId, catalog);
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
