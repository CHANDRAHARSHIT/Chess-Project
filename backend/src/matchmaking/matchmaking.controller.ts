import type { Request, Response } from "express";
import { matchmakingQueue } from "./MatchmakingQueue.js";
import { findBlockingPenalty } from "../anticheat/index.js";

/**
 * Thin Express HTTP controller adapter.
 * Contains no queue iteration or pairing logic — delegates everything to MatchmakingQueue.
 */
export function getUserIdFromRequest(req: Request): string {
  // req.user is populated by requireAuth (see matchmaking.route.ts) — the same field every
  // other authenticated controller (games, payment, user, customLinks) already reads.
  if (typeof req.user?.id === "string") {
    return req.user.id;
  }
  const headerUserId = req.headers["x-user-id"];
  if (typeof headerUserId === "string" && headerUserId.trim() !== "") {
    return headerUserId.trim();
  }
  return "dev-user-anonymous";
}

export const enqueueTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromRequest(req);

    const ban = await findBlockingPenalty(userId);
    if (ban) {
      res.status(403).json({
        error: "You are currently blocked from playing.",
        expiresAt: ban.expiresAt ?? null,
        caseId: ban.caseId,
      });
      return;
    }

    const variantId = typeof req.body?.variantId === "string" ? req.body.variantId : "chess960";
    const name = req.user?.name ?? undefined;
    const image = req.user?.image ?? undefined;

    const { ticket, descriptor } = matchmakingQueue.enqueue(userId, variantId, name, image);

    res.status(201).json({
      ticket,
      matched: descriptor !== null,
      matchDescriptor: descriptor ?? undefined,
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export const cancelTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromRequest(req);
    const { ticketId } = req.params;

    if (!ticketId) {
      res.status(400).json({ error: "Missing ticketId parameter." });
      return;
    }

    matchmakingQueue.cancel(ticketId, userId);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export const getTicketStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;

    if (!ticketId) {
      res.status(400).json({ error: "Missing ticketId parameter." });
      return;
    }

    const ticket = matchmakingQueue.getTicket(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found or expired." });
      return;
    }

    res.status(200).json({
      ticket,
      status: ticket.status,
      matchDescriptor: ticket.descriptor ?? undefined,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
