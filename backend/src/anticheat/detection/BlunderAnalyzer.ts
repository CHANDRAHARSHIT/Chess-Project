/**
 * Classifies moves by how much evaluation they threw away.
 *
 * Centipawn loss = eval before the move − eval after it, both from the moving
 * player's perspective (GameReplay normalises this). A positive loss means the
 * position got worse for the player who moved.
 *
 * Bands come from PolicyRegistry, never from constants here.
 */

import type { AnalyzedMove, Situation } from "../types.js";
import type { MoveQualityBands, PolicyRegistry } from "../feedback/PolicyRegistry.js";

export type MoveQuality = "best" | "good" | "inaccuracy" | "mistake" | "blunder";

export interface ClassifiedMove {
  readonly ply: number;
  readonly side: number;
  readonly san: string;
  readonly moveNumber: number;
  readonly quality: MoveQuality;
  /** Centipawns lost. Never negative — a move that improves the eval loses nothing. */
  readonly centipawnLoss: number;
  readonly evalBeforeCp: number;
  readonly evalAfterCp: number;
  /** The engine's preference, in UCI. */
  readonly bestMove?: string;
  readonly fenBefore: string;
}

export interface BlunderSummary {
  readonly side: number;
  readonly movesAnalysed: number;
  readonly blunders: number;
  readonly mistakes: number;
  readonly inaccuracies: number;
  readonly averageCentipawnLoss: number;
  /** Share of moves matching the engine's first choice, 0–1. */
  readonly bestMoveRate: number;
  readonly worstMove?: ClassifiedMove;
}

export class BlunderAnalyzer {
  constructor(private readonly policy: PolicyRegistry) {}

  classify(moves: readonly AnalyzedMove[], situation: Situation): ClassifiedMove[] {
    const bands = this.policy.getMoveQualityBands(situation);

    return moves
      .filter((m) => m.evalBeforeCp !== undefined && m.evalAfterCp !== undefined)
      .map((m) => {
        const loss = Math.min(bands.maxLoss, Math.max(0, m.evalBeforeCp! - m.evalAfterCp!));
        const best = m.engineBestMoves?.[0];
        return {
          ply: m.ply,
          side: m.side,
          san: m.san,
          moveNumber: Math.floor(m.ply / 2) + 1,
          quality: qualityFor(loss, bands, this.playedBestMove(m)),
          centipawnLoss: loss,
          evalBeforeCp: m.evalBeforeCp!,
          evalAfterCp: m.evalAfterCp!,
          ...(best ? { bestMove: best } : {}),
          fenBefore: m.fenBefore,
        };
      });
  }

  summarise(classified: readonly ClassifiedMove[], side: number): BlunderSummary {
    const own = classified.filter((m) => m.side === side);
    const totalLoss = own.reduce((sum, m) => sum + m.centipawnLoss, 0);
    const bestMoves = own.filter((m) => m.quality === "best").length;

    return {
      side,
      movesAnalysed: own.length,
      blunders: own.filter((m) => m.quality === "blunder").length,
      mistakes: own.filter((m) => m.quality === "mistake").length,
      inaccuracies: own.filter((m) => m.quality === "inaccuracy").length,
      averageCentipawnLoss: own.length > 0 ? Math.round(totalLoss / own.length) : 0,
      bestMoveRate: own.length > 0 ? bestMoves / own.length : 0,
      worstMove: own.reduce<ClassifiedMove | undefined>(
        (worst, m) => (!worst || m.centipawnLoss > worst.centipawnLoss ? m : worst),
        undefined
      ),
    };
  }

  /**
   * Whether the played move was the engine's first choice.
   *
   * Compares from+to only — the engine and the stored record can disagree on
   * promotion notation without disagreeing on the move.
   */
  private playedBestMove(move: AnalyzedMove): boolean {
    const best = move.engineBestMoves?.[0];
    if (!best || !move.uci) return false;
    return best.slice(0, 4) === move.uci.slice(0, 4);
  }
}

/** Quality bands are ordered worst-first so the first match wins. */
function qualityFor(
  loss: number,
  bands: MoveQualityBands,
  wasEngineBest: boolean
): MoveQuality {
  if (loss >= bands.blunder) return "blunder";
  if (loss >= bands.mistake) return "mistake";
  if (loss >= bands.inaccuracy) return "inaccuracy";
  if (wasEngineBest || loss <= bands.best) return "best";
  return "good";
}
