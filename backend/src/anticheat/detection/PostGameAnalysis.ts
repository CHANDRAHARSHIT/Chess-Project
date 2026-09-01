/**
 * Post-game blunder review: loads a finished game, replays it through the
 * engine, and classifies every move.
 *
 * First working slice of the Detection module. It produces a report a human
 * reads — it does not score, flag, or penalise anyone. Wiring this into
 * DetectionEngine as a scored Check comes later, once StatisticalBaselines
 * exists to compare against.
 */

import { Chess } from "chess.js";
import type { Situation } from "../types.js";
import {
  BlunderAnalyzer,
  type BlunderSummary,
  type ClassifiedMove,
  type TurningPoint,
} from "./BlunderAnalyzer.js";
import { GameReplay, parseStoredMoves, type StoredMove } from "./GameReplay.js";
import type { StockfishEngine } from "./engine/StockfishEngine.js";
import type { PolicyRegistry } from "../feedback/PolicyRegistry.js";

/** A finished game as the analyser needs it, decoupled from Prisma types. */
export interface AnalysableGame {
  readonly gameRecordId: string;
  readonly variantId: string;
  readonly startingFen: string;
  readonly moves: readonly StoredMove[];
  readonly participants: readonly { userId: string; side: number; name?: string }[];
  readonly endedAt: Date;
  readonly terminationReason: string;
  readonly outcomeKind: string;
  readonly winningSide: number | null;
}

export interface GameAnalysisReport {
  readonly gameRecordId: string;
  readonly variantId: string;
  readonly startingFen: string;
  readonly analysedAt: Date;
  readonly depth: number;
  readonly moves: readonly ClassifiedMove[];
  readonly summaries: readonly BlunderSummary[];
  /** Absent when the game stayed competitive to the end. */
  readonly turningPoint?: TurningPoint;
  readonly participants: readonly { userId: string; side: number; name?: string }[];
  readonly terminationReason: string;
  readonly outcomeKind: string;
  readonly winningSide: number | null;
}

/** Raised when a game cannot be analysed. The reason is shown to the caller. */
export class GameNotAnalysableError extends Error {}

const DEFAULT_DEPTH = 12;

export class PostGameAnalysis {
  private readonly replay: GameReplay;
  private readonly analyzer: BlunderAnalyzer;

  constructor(
    private readonly engine: StockfishEngine,
    policy: PolicyRegistry,
    private readonly depth = DEFAULT_DEPTH
  ) {
    this.replay = new GameReplay(engine);
    this.analyzer = new BlunderAnalyzer(policy);
  }

  async analyse(game: AnalysableGame, situation: Situation): Promise<GameAnalysisReport> {
    if (game.moves.length === 0) {
      throw new GameNotAnalysableError("Game has no recorded moves.");
    }

    if (!isValidFen(game.startingFen)) {
      throw new GameNotAnalysableError(
        `Starting position for game ${game.gameRecordId} is missing or invalid.`
      );
    }

    const analysed = await this.replay.replay({
      startingFen: game.startingFen,
      moves: game.moves,
      // Every current variant is Chess960; castling rights in a 960 FEN are
      // read differently and a standard-chess engine misreads them.
      chess960: true,
      depth: this.depth,
    });

    if (analysed.length === 0) {
      throw new GameNotAnalysableError(
        "No moves could be replayed — the record and the starting position disagree."
      );
    }

    const classified = this.analyzer.classify(analysed, situation);
    const sides = [...new Set(classified.map((m) => m.side))].sort();
    const turningPoint = this.analyzer.findTurningPoint(classified, situation);

    return {
      gameRecordId: game.gameRecordId,
      variantId: game.variantId,
      startingFen: game.startingFen,
      analysedAt: new Date(),
      depth: this.depth,
      moves: classified,
      summaries: sides.map((side) => this.analyzer.summarise(classified, side)),
      ...(turningPoint ? { turningPoint } : {}),
      participants: game.participants,
      terminationReason: game.terminationReason,
      outcomeKind: game.outcomeKind,
      winningSide: game.winningSide,
    };
  }
}

/** Reads the starting position out of a GameRecord's metadata JSON. */
export function startingFenFromMetadata(metadata: unknown, generateFen: (id: number) => string): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const { positionId } = metadata as Record<string, unknown>;
  if (typeof positionId !== "number" || !Number.isInteger(positionId)) return null;
  if (positionId < 0 || positionId > 959) return null;
  return generateFen(positionId);
}

export { parseStoredMoves };

function isValidFen(fen: string): boolean {
  if (!fen) return false;
  try {
    new Chess(fen);
    return true;
  } catch {
    return false;
  }
}
