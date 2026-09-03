import type { Request, Response, NextFunction } from "express";
import { OdysseyGameService } from "../services/odyssey-game.service.js";
import { EPlayerType } from "../models/odyssey/enums/EPlayerType.js";
import { requireUserAndSlotId, requireNodeId, requireExistingSlot } from "./odysseyControllerSupport.js";

const VALID_PLAYER_TYPES: string[] = Object.values(EPlayerType);

export class OdysseyGameController {
  /**
   * GET /api/odyssey/slots
   * Returns a progress summary for each of the authenticated user's save slots.
   */
  static async getAllSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "fail", message: "Unauthorized. Please sign in." });
      }

      const slots = await OdysseyGameService.getAllSlotSummaries(userId);
      res.status(200).json({ status: "success", data: { slots } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/odyssey/slots/:slotId
   * Returns the full run state for one save slot.
   */
  static async getSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const game = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!game) return;

      res.status(200).json({ status: "success", data: { game } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/odyssey/slots/:slotId/start
   * Starts a brand-new run for the slot (overwrites any existing run there).
   */
  static async startNewRun(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const game = await OdysseyGameService.startNewRun(guard.userId, guard.slotId);
      res.status(200).json({ status: "success", data: { game } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/odyssey/slots/:slotId/character
   * Body: { type: EPlayerType }
   * No-ops (per OdysseyPlayer.select) if the type is locked/unknown — the
   * response still reflects whatever the run's player ended up as.
   */
  static async selectCharacter(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const { type } = req.body;
      if (typeof type !== "string" || !VALID_PLAYER_TYPES.includes(type)) {
        return res.status(400).json({ status: "fail", message: `type must be one of: ${VALID_PLAYER_TYPES.join(", ")}.` });
      }

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const game = await OdysseyGameService.selectCharacter(guard.userId, guard.slotId, type as EPlayerType);
      res.status(200).json({ status: "success", data: { game } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/odyssey/slots/:slotId/nodes/:nodeId/enter
   * Marks a node as entered (updates currentNodeId).
   */
  static async enterNode(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const nodeId = requireNodeId(req, res);
      if (nodeId === undefined) return;

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const game = await OdysseyGameService.enterNode(guard.userId, guard.slotId, nodeId);
      res.status(200).json({ status: "success", data: { game } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/odyssey/slots/:slotId/reset
   * Body: { keepProgress: boolean }
   */
  static async resetRun(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const { keepProgress } = req.body;
      if (typeof keepProgress !== "boolean") {
        return res.status(400).json({ status: "fail", message: "keepProgress must be a boolean." });
      }

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const game = await OdysseyGameService.resetRun(guard.userId, guard.slotId, keepProgress);
      res.status(200).json({ status: "success", data: { game } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/odyssey/slots/:slotId
   */
  static async deleteSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      await OdysseyGameService.deleteSlot(guard.userId, guard.slotId);
      res.status(200).json({ status: "success", data: null });
    } catch (error) {
      next(error);
    }
  }
}
