/**
 * Maia-3 move endpoint, for the /test-maia page.
 *
 * Exists because Maia cannot run in the browser the way Stockfish does — it is a
 * PyTorch model, so the client asks the server for each move.
 */

import { Router, type Request, type Response } from "express";
import { Chess } from "chess.js";
import { env } from "../config/env.js";
import { reportError } from "../observability/index.js";
import { MaiaEngine } from "./MaiaEngine.js";

export const maiaRouter = Router();

/** One engine for the process — booting a PyTorch model per request would be absurd. */
let engine: MaiaEngine | null = null;

function getEngine(): MaiaEngine {
  if (!engine) engine = new MaiaEngine(env.MAIA_UCI_COMMAND, env.MAIA_MODEL);
  return engine;
}

/** Frees the engine on shutdown. */
export function stopMaiaEngine(): void {
  engine?.stop();
  engine = null;
}

maiaRouter.use((_req, res, next) => {
  if (!env.MAIA_ENABLED) {
    res.status(503).json({ status: "fail", message: "Maia is not enabled on this server." });
    return;
  }
  next();
});

/** Reports whether the engine is configured and which model is loaded. */
maiaRouter.get("/status", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    data: { model: env.MAIA_MODEL, running: getEngine().isRunning() },
  });
});

/**
 * POST /api/maia/move
 * Body: { moves: string[], elo: number }
 *
 * `moves` are UCI moves from the standard starting position. Maia conditions on
 * the game so far, not just the current board, so the history is required rather
 * than a FEN.
 */
maiaRouter.post("/move", async (req: Request, res: Response) => {
  const { moves, elo } = req.body ?? {};

  if (!Array.isArray(moves) || moves.some((m) => typeof m !== "string")) {
    return res.status(400).json({ status: "fail", message: "`moves` must be an array of UCI strings." });
  }
  if (typeof elo !== "number" || !Number.isFinite(elo)) {
    return res.status(400).json({ status: "fail", message: "`elo` must be a number." });
  }
  if (moves.length > 600) {
    return res.status(400).json({ status: "fail", message: "Too many moves." });
  }

  // Replay before asking the engine: a bad history would otherwise be a confusing
  // engine error, and an illegal move list must never reach a subprocess.
  const board = new Chess();
  for (const move of moves) {
    try {
      board.move(move);
    } catch {
      return res.status(400).json({ status: "fail", message: `Illegal move in history: ${move}` });
    }
  }
  if (board.isGameOver()) {
    return res.status(409).json({ status: "fail", message: "The game is already over." });
  }

  try {
    const result = await getEngine().getMove({ moves, elo });

    // Maia is a move-prediction model, not a rules engine — verify before trusting.
    try {
      board.move(result.move);
    } catch {
      return res.status(502).json({
        status: "fail",
        message: `Maia proposed an illegal move (${result.move}).`,
      });
    }

    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    reportError({
      domain: "maia",
      error: err as Error,
      fatal: false,
      context: { elo, moveCount: moves.length },
    });
    res.status(503).json({
      status: "fail",
      message: `Maia is unavailable: ${(err as Error).message}`,
    });
  }
});
