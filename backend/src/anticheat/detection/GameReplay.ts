/**
 * Replays a stored game into engine-evaluated `AnalyzedMove`s.
 *
 * A stored move is `{from, to, promotion?}` with no board attached, so replay
 * needs the starting FEN. For Chess960 that is derived from the `positionId`
 * carried in `GameRecord.metadata`; without it the game cannot be analysed.
 *
 * Each ply costs one engine call, so a 40-move game is ~80 calls. Depth is the
 * main cost lever — see AnalysisOptions.
 */

import { Chess } from "chess.js";
import type { AnalyzedMove } from "../types.js";
import type { StockfishEngine } from "./engine/StockfishEngine.js";

/** A move as stored in `GameRecord.moveHistory`. */
export interface StoredMove {
  readonly from: string;
  readonly to: string;
  readonly promotion?: string;
}

export interface ReplayInput {
  readonly startingFen: string;
  readonly moves: readonly StoredMove[];
  readonly chess960: boolean;
  /** Which side to analyse (0 = white, 1 = black). Omit to analyse both. */
  readonly sideIndex?: number;
  readonly depth?: number;
}

/** Narrows unknown JSON from the database into StoredMoves, dropping malformed entries. */
export function parseStoredMoves(raw: unknown): StoredMove[] {
  if (!Array.isArray(raw)) return [];
  const moves: StoredMove[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const { from, to, promotion } = entry as Record<string, unknown>;
    if (typeof from !== "string" || typeof to !== "string") continue;
    moves.push({
      from,
      to,
      ...(typeof promotion === "string" ? { promotion } : {}),
    });
  }
  return moves;
}

export class GameReplay {
  constructor(private readonly engine: StockfishEngine) {}

  /**
   * Walks the game, evaluating the position before and after every ply.
   *
   * The position after ply N is the position before ply N+1, so evaluations are
   * carried forward rather than recomputed — this halves the engine calls.
   *
   * Both evals are normalised to the *moving side's* perspective, so a positive
   * `evalBeforeCp` always means the player about to move is better. Without this
   * normalisation every Black move would look like a blunder.
   */
  async replay(input: ReplayInput): Promise<AnalyzedMove[]> {
    const chess = new Chess(input.startingFen);
    const analysed: AnalyzedMove[] = [];

    let evalBefore = await this.engine.evaluate(chess.fen(), input.chess960, input.depth);

    for (let ply = 0; ply < input.moves.length; ply++) {
      const stored = input.moves[ply];
      const fenBefore = chess.fen();
      const sideToMove = chess.turn() === "w" ? 0 : 1;
      const bestMoves = evalBefore.bestMove ? [evalBefore.bestMove] : [];
      // Counted before the move is applied, and free next to the engine call.
      // Capturing it now is what lets a cached analysis answer "was this move
      // forced?" without replaying the game again.
      const legalMoveCount = chess.moves().length;

      let san: string;
      try {
        const applied = chess.move({
          from: stored.from,
          to: stored.to,
          ...(stored.promotion ? { promotion: stored.promotion } : {}),
        });
        san = applied.san;
      } catch {
        // A move the rules engine accepted at play time but chess.js rejects on
        // replay means the record and the starting position disagree. Stop
        // rather than emit analysis for a board that never existed.
        break;
      }

      const evalAfter = await this.engine.evaluate(chess.fen(), input.chess960, input.depth);

      if (input.sideIndex === undefined || input.sideIndex === sideToMove) {
        analysed.push({
          ply,
          side: sideToMove,
          fenBefore,
          san,
          uci: `${stored.from}${stored.to}${stored.promotion ?? ""}`,
          // Not recorded during play — see README blocker #1. Zero is a
          // placeholder, and every timing check must treat it as absent.
          thinkTimeMs: 0,
          clockRemainingMs: 0,
          evalBeforeCp: evalBefore.scoreCp,
          // evalAfter is from the opponent's perspective; negate so both
          // numbers describe the player who just moved.
          evalAfterCp: -evalAfter.scoreCp,
          engineBestMoves: bestMoves,
          legalMoveCount,
        });
      }

      evalBefore = evalAfter;
    }

    return analysed;
  }
}
