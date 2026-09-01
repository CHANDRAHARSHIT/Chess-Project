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
  /** True only when the move matched the engine's first choice. */
  readonly matchedEngineBest: boolean;
  /** Per-move accuracy, 0–100. */
  readonly accuracy: number;
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
  /** Mean per-move accuracy, 0–100. */
  readonly accuracy: number;
  /** Share of moves matching the engine's first choice, 0–1. */
  readonly bestMoveRate: number;
  /**
   * Longest run of consecutive moves matching the engine's first choice.
   *
   * A Type 1 cheating signal in its own right: a player can hold an
   * unremarkable whole-game average while following the engine through one
   * decisive stretch. Reported only — judging it needs StatisticalBaselines,
   * since a long streak is expected in forced sequences and simple endgames.
   */
  readonly longestEngineBestStreak: number;
  readonly worstMove?: ClassifiedMove;
}

/** The point a game stopped being competitive. */
export interface TurningPoint {
  readonly ply: number;
  readonly moveNumber: number;
  readonly san: string;
  /** Side that played this move — not necessarily the side it favoured. */
  readonly side: number;
  /** Side that held the decisive advantage from here on. */
  readonly favouredSide: number;
  /** From White's point of view. */
  readonly evalCp: number;
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
        const matchedEngineBest = this.playedBestMove(m);
        return {
          ply: m.ply,
          side: m.side,
          san: m.san,
          moveNumber: Math.floor(m.ply / 2) + 1,
          quality: qualityFor(loss, bands, matchedEngineBest),
          centipawnLoss: loss,
          matchedEngineBest,
          // Raw evals, not the clamped loss: win percentage saturates on its own.
          accuracy: accuracyFor(m.evalBeforeCp!, m.evalAfterCp!),
          evalBeforeCp: m.evalBeforeCp!,
          evalAfterCp: m.evalAfterCp!,
          ...(best ? { bestMove: best } : {}),
          fenBefore: m.fenBefore,
        };
      });
  }

  summarise(classified: readonly ClassifiedMove[], side: number): BlunderSummary {
    const own = classified.filter((m) => m.side === side);
    const mean = (total: number) => (own.length > 0 ? total / own.length : 0);
    const matched = own.filter((m) => m.matchedEngineBest).length;

    return {
      side,
      movesAnalysed: own.length,
      blunders: own.filter((m) => m.quality === "blunder").length,
      mistakes: own.filter((m) => m.quality === "mistake").length,
      inaccuracies: own.filter((m) => m.quality === "inaccuracy").length,
      averageCentipawnLoss: Math.round(mean(own.reduce((s, m) => s + m.centipawnLoss, 0))),
      accuracy: Number(mean(own.reduce((s, m) => s + m.accuracy, 0)).toFixed(1)),
      bestMoveRate: mean(matched),
      longestEngineBestStreak: longestStreak(own),
      worstMove: own.reduce<ClassifiedMove | undefined>(
        (worst, m) => (!worst || m.centipawnLoss > worst.centipawnLoss ? m : worst),
        undefined
      ),
    };
  }

  /**
   * The earliest move after which one side stays decisively ahead for the rest
   * of the game — the point it stopped being a contest.
   *
   * Deliberately not the largest single mistake: that is already reported as the
   * worst move, and a game can be decided by accumulation rather than one error.
   */
  findTurningPoint(
    classified: readonly ClassifiedMove[],
    situation: Situation
  ): TurningPoint | undefined {
    const threshold = this.policy.getDecisiveAdvantageCp(situation);
    const ordered = [...classified].sort((a, b) => a.ply - b.ply);

    let candidate: TurningPoint | undefined;
    for (const move of ordered) {
      // evalAfterCp is from the mover's perspective; normalise to White's.
      const whiteCp = move.side === 0 ? move.evalAfterCp : -move.evalAfterCp;

      if (Math.abs(whiteCp) < threshold) {
        candidate = undefined; // Back to a contest — any earlier candidate is void.
        continue;
      }

      const favouredSide = whiteCp > 0 ? 0 : 1;
      if (candidate?.favouredSide !== favouredSide) {
        candidate = {
          ply: move.ply,
          moveNumber: move.moveNumber,
          san: move.san,
          side: move.side,
          favouredSide,
          evalCp: whiteCp,
        };
      }
    }
    return candidate;
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

/** Longest run of consecutive plies that matched the engine's first choice. */
function longestStreak(moves: readonly ClassifiedMove[]): number {
  let longest = 0;
  let current = 0;
  for (const move of moves) {
    current = move.matchedEngineBest ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

/**
 * Per-move accuracy, using Lichess's published model: centipawns are converted
 * to a win percentage, and accuracy is an exponential decay over how much win
 * percentage the move gave away.
 *
 * Centipawn loss alone is a poor accuracy proxy — dropping 100cp from a level
 * position matters far more than dropping it from +900, and win percentage
 * captures that where raw centipawns do not.
 */
function accuracyFor(evalBeforeCp: number, evalAfterCp: number): number {
  const winPercentLost = winPercent(evalBeforeCp) - winPercent(evalAfterCp);
  if (winPercentLost <= 0) return 100;
  const accuracy = 103.1668 * Math.exp(-0.04354 * winPercentLost) - 3.1669;
  return Math.max(0, Math.min(100, accuracy));
}

/** Centipawns → win probability (0–100) for the side to move. */
function winPercent(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
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
