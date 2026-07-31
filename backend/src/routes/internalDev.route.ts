import crypto from "crypto";
import { Router } from "express";
import type { Request, Response } from "express";
import { env } from "../config/env.js";
import type { SessionManager } from "../session/index.js";
import type { MatchDescriptor } from "../contracts/index.js";

/**
 * Internal, dev-only harness for M2 verification.
 *
 * M2 deliberately excludes Matchmaking (Phase 3 §5 — proves Session+Variant+Transport
 * in isolation first). This route manually builds a MatchDescriptor so two real WebSocket
 * clients can be seeded into a session and play a full game. Throwaway: replaced by real
 * Matchmaking → Session wiring in M3.
 *
 * Gated by MULTIPLAYER_ENABLED and NODE_ENV !== "production" (double-gated on purpose).
 */
export function createInternalDevRouter(sessionManager: SessionManager): Router {
  const router = Router();

  router.use((_req, res, next) => {
    if (!env.MULTIPLAYER_ENABLED || env.NODE_ENV === "production") {
      res.status(503).json({ error: "Internal dev routes are disabled." });
      return;
    }
    next();
  });

  router.post("/create-session", (req: Request, res: Response) => {
    const userIds = req.body?.userIds;
    if (!Array.isArray(userIds) || userIds.length !== 2 || userIds.some((id) => typeof id !== "string")) {
      res.status(400).json({ error: "Body must include userIds: [string, string]." });
      return;
    }

    const descriptor: MatchDescriptor = {
      matchId: crypto.randomUUID(),
      participants: [
        { userId: userIds[0], side: 0 },
        { userId: userIds[1], side: 1 },
      ],
      cardinality: { sides: 2, perSide: 1 },
      variantId: "chess960",
      variantParams: {},
      timeControl: { initialSeconds: 300, incrementSeconds: 3, label: "5+3 Blitz" },
      rated: false,
      provenance: "internal",
      createdAt: new Date().toISOString(),
    };

    const session = sessionManager.createSession(descriptor);
    res.status(201).json({ sessionId: session.sessionId, matchDescriptor: descriptor });
  });

  return router;
}
