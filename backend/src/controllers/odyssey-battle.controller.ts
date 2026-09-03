import type { Request, Response, NextFunction } from "express";
import { OdysseyBattleService, type OdysseyBattleSnapshot } from "../services/odyssey-battle.service.js";
import { ERelicType } from "../models/odyssey/enums/ERelicType.js";
import { EBattleEndReason } from "../models/odyssey/enums/EBattleEndReason.js";
import { ETimeDirection } from "../models/odyssey/enums/ETimeDirection.js";
import { requireUserAndSlotId, requireNodeId, requireExistingSlot } from "./odysseyControllerSupport.js";

const VALID_RELIC_TYPES: string[] = Object.values(ERelicType);
const VALID_END_REASONS: string[] = Object.values(EBattleEndReason);
const VALID_TIME_DIRECTIONS: string[] = Object.values(ETimeDirection);

function isSnapshot(value: unknown): value is OdysseyBattleSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Record<string, unknown>;
  return (
    typeof snapshot.playerInitialSeconds === "number" &&
    typeof snapshot.enemyInitialSeconds === "number" &&
    typeof snapshot.playerSeconds === "number" &&
    typeof snapshot.enemySeconds === "number" &&
    typeof snapshot.evalMovesRemaining === "number" &&
    typeof snapshot.botConditions === "object" &&
    snapshot.botConditions !== null &&
    typeof (snapshot.botConditions as Record<string, unknown>).confused === "number" &&
    typeof (snapshot.botConditions as Record<string, unknown>).relaxed === "number" &&
    typeof (snapshot.botConditions as Record<string, unknown>).distracted === "number"
  );
}

export class OdysseyBattleController {
  /**
   * POST /api/odyssey/slots/:slotId/nodes/:nodeId/battle
   * Enters a battle node and returns a fresh snapshot for the client to drive the fight with.
   */
  static async startBattle(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const nodeId = requireNodeId(req, res);
      if (nodeId === undefined) return;

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const { game, snapshot, monster } = await OdysseyBattleService.startBattle(guard.userId, guard.slotId, nodeId);
      res.status(200).json({ status: "success", data: { game, snapshot, monster } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/odyssey/slots/:slotId/nodes/:nodeId/battle/move
   * Body: { snapshot: OdysseyBattleSnapshot, move: { isCheck: boolean, isCapture: boolean } }
   */
  static async registerPlayerMove(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const nodeId = requireNodeId(req, res);
      if (nodeId === undefined) return;

      const { snapshot, move } = req.body;
      if (!isSnapshot(snapshot)) {
        return res.status(400).json({ status: "fail", message: "A valid battle snapshot must be provided." });
      }
      if (!move || typeof move.isCheck !== "boolean" || typeof move.isCapture !== "boolean") {
        return res.status(400).json({ status: "fail", message: "move.isCheck and move.isCapture must be booleans." });
      }

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const updatedSnapshot = await OdysseyBattleService.registerPlayerMove(guard.userId, guard.slotId, nodeId, snapshot, move);
      res.status(200).json({ status: "success", data: { snapshot: updatedSnapshot } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/odyssey/slots/:slotId/nodes/:nodeId/battle/ai-move
   * Body: { snapshot: OdysseyBattleSnapshot, fen: string }
   */
  static async computeAiMove(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const nodeId = requireNodeId(req, res);
      if (nodeId === undefined) return;

      const { snapshot, fen } = req.body;
      if (!isSnapshot(snapshot)) {
        return res.status(400).json({ status: "fail", message: "A valid battle snapshot must be provided." });
      }
      if (typeof fen !== "string" || fen.trim() === "") {
        return res.status(400).json({ status: "fail", message: "fen must be a non-empty string." });
      }

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const result = await OdysseyBattleService.computeAiMove(guard.userId, guard.slotId, nodeId, snapshot, fen);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/odyssey/slots/:slotId/nodes/:nodeId/battle/relic
   * Body: { snapshot: OdysseyBattleSnapshot, relicType: ERelicType, direction?: ETimeDirection }
   */
  static async applyChargeAction(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const nodeId = requireNodeId(req, res);
      if (nodeId === undefined) return;

      const { snapshot, relicType, direction } = req.body;
      if (!isSnapshot(snapshot)) {
        return res.status(400).json({ status: "fail", message: "A valid battle snapshot must be provided." });
      }
      if (typeof relicType !== "string" || !VALID_RELIC_TYPES.includes(relicType)) {
        return res.status(400).json({ status: "fail", message: `relicType must be one of: ${VALID_RELIC_TYPES.join(", ")}.` });
      }
      if (direction !== undefined && !VALID_TIME_DIRECTIONS.includes(direction)) {
        return res.status(400).json({ status: "fail", message: `direction must be one of: ${VALID_TIME_DIRECTIONS.join(", ")}.` });
      }

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const result = await OdysseyBattleService.applyChargeAction(
        guard.userId,
        guard.slotId,
        nodeId,
        snapshot,
        relicType as ERelicType,
        direction as ETimeDirection | undefined
      );
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/odyssey/slots/:slotId/nodes/:nodeId/battle/resolve
   * Body: { snapshot: OdysseyBattleSnapshot, endReason: EBattleEndReason, playerWon: boolean }
   */
  static async resolveOutcome(req: Request, res: Response, next: NextFunction) {
    try {
      const guard = requireUserAndSlotId(req, res);
      if (!guard.ok) return;

      const nodeId = requireNodeId(req, res);
      if (nodeId === undefined) return;

      const { snapshot, endReason, playerWon } = req.body;
      if (!isSnapshot(snapshot)) {
        return res.status(400).json({ status: "fail", message: "A valid battle snapshot must be provided." });
      }
      if (typeof endReason !== "string" || !VALID_END_REASONS.includes(endReason)) {
        return res.status(400).json({ status: "fail", message: `endReason must be one of: ${VALID_END_REASONS.join(", ")}.` });
      }
      if (typeof playerWon !== "boolean") {
        return res.status(400).json({ status: "fail", message: "playerWon must be a boolean." });
      }

      const existing = await requireExistingSlot(guard.userId, guard.slotId, res);
      if (!existing) return;

      const result = await OdysseyBattleService.resolveOutcome(
        guard.userId,
        guard.slotId,
        nodeId,
        snapshot,
        endReason as EBattleEndReason,
        playerWon
      );
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
}
