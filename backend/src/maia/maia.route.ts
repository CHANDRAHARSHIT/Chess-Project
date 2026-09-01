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

/**
 * Boots the engine and plays one throwaway move at server start.
 *
 * Loading the 79M model into memory takes several seconds and only happens on
 * the first `go`. Without this the first player pays that cost and, on a small
 * container, hits the request timeout. Fire-and-forget: a failure here must not
 * stop the server, and the route still reports it.
 */
export function warmMaiaEngine(): void {
  if (!env.MAIA_ENABLED) return;

  getEngine()
    .getMove({ moves: [], elo: 1500 })
    .then(({ latencyMs }) => console.log(`[maia] engine warm (first move ${latencyMs}ms)`))
    .catch((err) =>
      reportError({
        domain: "maia",
        error: err as Error,
        fatal: false,
        context: { reason: "warmup_failed" },
      })
    );
}

maiaRouter.use((_req, res, next) => {
  if (!env.MAIA_ENABLED) {
    res.status(503).json({ status: "fail", message: "Maia is not enabled on this server." });
    return;
  }
  next();
});

/**
 * Reports engine state. `boot` actually starts the engine and returns the error
 * if it fails — the only way to diagnose a deploy without reading server logs.
 */
maiaRouter.get("/status", async (req: Request, res: Response) => {
  const engine = getEngine();
  let bootError: string | null = null;

  if (req.query.boot === "1") {
    try {
      await engine.init();
    } catch (err) {
      bootError = (err as Error).message;
    }
  }

  res.status(200).json({
    status: "success",
    data: {
      model: env.MAIA_MODEL,
      configuredCommand: env.MAIA_UCI_COMMAND || "(auto-detect)",
      running: engine.isRunning(),
      command: engine.getResolvedCommand(),
      ...(req.query.boot === "1" ? { interpreters: await engine.diagnose() } : {}),
      ...(bootError ? { bootError } : {}),
    },
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
