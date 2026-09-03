import { Chess } from "chess.js";
import { StockfishEngine } from "../anticheat/detection/engine/StockfishEngine.js";
import { EDifficulty } from "../models/odyssey/enums/EDifficulty.js";

/**
 * Depth-per-difficulty mapping mirrors frontend/src/shared/chess/chess.types.ts's
 * DIFFICULTY_CONFIGS (skillLevel/depth/timeLimit per tier). StockfishEngine only
 * exposes a depth knob (no "Skill Level" UCI option wired in), so only depth
 * carries over server-side; skillLevel/timeLimit stay frontend-only concepts.
 */
const DEPTH_BY_DIFFICULTY: Record<EDifficulty, number> = {
  [EDifficulty.Beginner]: 1,
  [EDifficulty.Easy]: 3,
  [EDifficulty.Intermediate]: 6,
  [EDifficulty.Advanced]: 10,
  [EDifficulty.Master]: 20,
};

// One persistent engine process for the whole server, matching StockfishEngine's
// own design (it queues requests; booting a fresh process per move would be
// far too slow for a "go depth" every AI turn).
let sharedEngine: StockfishEngine | null = null;

function getSharedEngine(): StockfishEngine {
  if (!sharedEngine) {
    sharedEngine = new StockfishEngine();
  }
  return sharedEngine;
}

/**
 * Injected into OdysseyBattle.computeAiMove as `getEngineMove` — the engine
 * connection lives in the service layer, not on the model (see the model's
 * own doc comment on why it takes this as a parameter instead of importing
 * an engine itself).
 */
export async function getEngineMove(fen: string, difficulty: EDifficulty): Promise<string> {
  const depth = DEPTH_BY_DIFFICULTY[difficulty];
  const evaluation = await getSharedEngine().evaluate(fen, false, depth);
  if (!evaluation.bestMove) {
    throw new Error(`Stockfish returned no move for FEN "${fen}" — the position may already be terminal.`);
  }
  return evaluation.bestMove;
}

/** Injected into OdysseyBattle.computeAiMove as `getLegalMoves`, for the "Confused" random-move branch. */
export function getLegalMoves(fen: string): string[] {
  const chess = new Chess(fen);
  return chess.moves({ verbose: true }).map(move => `${move.from}${move.to}${move.promotion ?? ""}`);
}
