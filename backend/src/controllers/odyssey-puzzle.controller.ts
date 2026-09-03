import type { Request, Response, NextFunction } from "express";
import { OdysseyPuzzleService } from "../services/odyssey-puzzle.service.js";
import { requireUserAndSlotId, requireNodeId, requireExistingSlot } from "./odysseyControllerSupport.js";

export class OdysseyPuzzleController {
  /**
   * POST /api/odyssey/slots/:slotId/nodes/:nodeId/puzzle
   * Enters a puzzle node and fetches its puzzle set.
   */
  static async enterPuzzle(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const nodeId = requireNodeId(req, res);
      if (nodeId === undefined) return;

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const result = await OdysseyPuzzleService.enterPuzzle(guard.userId, guard.slotId, nodeId);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/odyssey/slots/:slotId/nodes/:nodeId/puzzle/resolve
   * Body: { solvedCount: number, totalCount: number }
   */
  static async resolvePuzzle(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const nodeId = requireNodeId(req, res);
      if (nodeId === undefined) return;

      const { solvedCount, totalCount } = req.body;
      if (typeof solvedCount !== "number" || !Number.isInteger(solvedCount) || solvedCount < 0) {
        return res.status(400).json({ status: "fail", message: "solvedCount must be a non-negative integer." });
      }
      if (typeof totalCount !== "number" || !Number.isInteger(totalCount) || totalCount <= 0) {
        return res.status(400).json({ status: "fail", message: "totalCount must be a positive integer." });
      }

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const result = await OdysseyPuzzleService.resolvePuzzle(guard.userId, guard.slotId, nodeId, solvedCount, totalCount);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
}
