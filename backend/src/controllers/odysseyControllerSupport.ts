import type { Request, Response } from "express";
import { OdysseyGameService } from "../services/odyssey-game.service.js";
import type { OdysseyGame } from "../models/odyssey/models/OdysseyGame.js";

/**
 * Shared request-parsing/existence-check helpers for the Odyssey
 * controllers. Every Odyssey route is scoped to the authenticated user's
 * own save slot, so each controller method needs the same three checks
 * (signed in, slotId looks like a slot, slot actually exists) before
 * calling into a Service — pulled out here instead of repeating them
 * five times over.
 */

export type OdysseyRequestGuardResult = { ok: true; userId: string; slotId: number } | { ok: false };

/** Resolves the authenticated user + a numeric slotId path param, writing a 401/400 response and returning ok:false if either is missing/invalid. */
export function requireUserAndSlotId(req: Request, res: Response): OdysseyRequestGuardResult {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ status: "fail", message: "Unauthorized. Please sign in." });
    return { ok: false };
  }

  const slotId = Number(req.params.slotId);
  if (!Number.isInteger(slotId) || slotId <= 0) {
    res.status(400).json({ status: "fail", message: "A valid slotId must be provided." });
    return { ok: false };
  }

  return { ok: true, userId, slotId };
}

/** Parses the :nodeId path param, writing a 400 response and returning undefined if it isn't a valid integer. */
export function requireNodeId(req: Request, res: Response): number | undefined {
  const nodeId = Number(req.params.nodeId);
  if (!Number.isInteger(nodeId)) {
    res.status(400).json({ status: "fail", message: "A valid nodeId must be provided." });
    return undefined;
  }
  return nodeId;
}

/** Loads the run for (userId, slotId), writing a 404 response and returning undefined if no run exists for that slot yet. */
export async function requireExistingSlot(userId: string, slotId: number, res: Response): Promise<OdysseyGame | undefined> {
  const game = await OdysseyGameService.getSlot(userId, slotId);
  if (!game) {
    res.status(404).json({ status: "fail", message: `No Odyssey run found for slot ${slotId}.` });
    return undefined;
  }
  return game;
}
