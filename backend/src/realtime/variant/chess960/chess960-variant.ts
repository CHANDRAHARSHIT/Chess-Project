import crypto from "crypto";
import type {
  VariantContract,
  VariantCardinality,
  GameState,
  Move,
  MoveValidationResult,
  TerminalOutcome,
} from "../../../contracts/index.js";
import type { Chess960GameState } from "./chess960-game-state.js";
import {
  generateStartingFen,
  validateMoveFen,
  applyMoveFen,
  legalMovesFromFen,
  isCheckmate,
  isStalemate,
  isDraw,
  getActiveSideIndex,
} from "./chess960-rules.js";

/**
 * Pure-function implementation of VariantContract for Chess960.
 * Server-side rules authority. Zero I/O, zero side effects.
 */
export class Chess960VariantImpl implements VariantContract {
  readonly variantId = "chess960";

  getCardinality(_params: Readonly<Record<string, unknown>>): VariantCardinality {
    return {
      sides: 2,
      perSide: 1,
      turnOrder: [0, 1],
    };
  }

  initialState(params: Readonly<Record<string, unknown>>): GameState {
    let positionId: number;

    if (
      typeof params.positionId === "number" &&
      Number.isInteger(params.positionId) &&
      params.positionId >= 0 &&
      params.positionId <= 959
    ) {
      positionId = params.positionId;
    } else {
      // Cryptographically secure integer selection for server-generated positions (0–959)
      positionId = crypto.randomInt(0, 960);
    }

    const fen = generateStartingFen(positionId);

    const state: Chess960GameState = {
      fen,
      positionId,
    };

    return state;
  }

  validateMove(
    state: GameState,
    move: Move,
    sideIndex: number
  ): MoveValidationResult {
    const fen = (state as unknown as Chess960GameState).fen;
    if (typeof fen !== "string") {
      return { legal: false, reason: "Malformed game state: FEN missing or not a string." };
    }
    const res = validateMoveFen(fen, move, sideIndex);
    if (!res.legal) {
      return { legal: false, reason: res.reason ?? "Illegal move." };
    }
    return { legal: true };
  }

  applyMove(state: GameState, move: Move): GameState {
    const current = state as unknown as Chess960GameState;
    const nextFen = applyMoveFen(current.fen, move);

    const nextState: Chess960GameState = {
      fen: nextFen,
      positionId: current.positionId,
    };

    return nextState;
  }

  isTerminal(state: GameState): boolean {
    const fen = (state as unknown as Chess960GameState).fen;
    if (typeof fen !== "string") return false;
    return isCheckmate(fen) || isStalemate(fen) || isDraw(fen);
  }

  getOutcome(state: GameState): TerminalOutcome {
    const fen = (state as unknown as Chess960GameState).fen;
    if (typeof fen !== "string") {
      return { kind: "draw", reason: "invalid_state" };
    }

    if (isCheckmate(fen)) {
      // The side whose turn it is is checkmated; the opposite side wins.
      const matedSide = getActiveSideIndex(fen);
      const winningSide = matedSide === 0 ? 1 : 0;
      return {
        kind: "win",
        winningSide,
        reason: "checkmate",
      };
    }

    if (isStalemate(fen)) {
      return {
        kind: "draw",
        reason: "stalemate",
      };
    }

    return {
      kind: "draw",
      reason: "draw",
    };
  }

  legalMoves(state: GameState, sideIndex: number): Move[] {
    const fen = (state as unknown as Chess960GameState).fen;
    if (typeof fen !== "string") return [];
    return legalMovesFromFen(fen, sideIndex);
  }
}

/** Singleton instance for the registry */
export const Chess960Variant = new Chess960VariantImpl();
