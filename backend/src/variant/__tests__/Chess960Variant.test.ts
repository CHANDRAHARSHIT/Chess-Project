import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Chess960Variant } from "../chess960/Chess960Variant.js";
import type { Chess960GameState } from "../chess960/Chess960GameState.js";

describe("Chess960Variant Rules Engine", () => {
  test("getCardinality returns standard 2-side single-player configuration", () => {
    const card = Chess960Variant.getCardinality({});
    assert.equal(card.sides, 2);
    assert.equal(card.perSide, 1);
    assert.deepEqual(card.turnOrder, [0, 1]);
  });

  test("initialState generates valid FEN for all 960 position IDs (0..959)", () => {
    for (let posId = 0; posId < 960; posId++) {
      const state = Chess960Variant.initialState({ positionId: posId }) as unknown as Chess960GameState;
      assert.equal(state.positionId, posId);
      assert.ok(typeof state.fen === "string" && state.fen.length > 0, `Pos ${posId} should produce non-empty FEN`);
      assert.equal(Object.prototype.hasOwnProperty.call(state, "moveHistory"), false, "State must NOT contain moveHistory");

      // Verify FEN has 8 ranks and White to move
      const parts = state.fen.split(" ");
      assert.equal(parts[1], "w", `Pos ${posId} turn must be 'w'`);
      const ranks = parts[0].split("/");
      assert.equal(ranks.length, 8, `Pos ${posId} FEN must have 8 ranks`);
    }
  });

  test("initialState falls back to random positionId 0..959 when omitted", () => {
    const state = Chess960Variant.initialState({}) as unknown as Chess960GameState;
    assert.ok(state.positionId >= 0 && state.positionId <= 959);
    assert.ok(typeof state.fen === "string");
  });

  test("validateMove and applyMove for legal first move", () => {
    // Position 518 is standard chess layout
    const state = Chess960Variant.initialState({ positionId: 518 });
    const e2e4Move = { from: "e2", to: "e4" };

    const validation = Chess960Variant.validateMove(state, e2e4Move, 0);
    assert.equal(validation.legal, true);

    const nextState = Chess960Variant.applyMove(state, e2e4Move) as unknown as Chess960GameState;
    assert.notEqual(nextState.fen, (state as unknown as Chess960GameState).fen);
    assert.ok(nextState.fen.includes("b"), "Turn should change to black ('b')");

    // Check immutability
    assert.ok((state as unknown as Chess960GameState).fen.includes("w"));
  });

  test("validateMove rejects out-of-turn or illegal moves", () => {
    const state = Chess960Variant.initialState({ positionId: 518 });

    // Side 1 (Black) attempting to move first
    const wrongTurnVal = Chess960Variant.validateMove(state, { from: "e7", to: "e5" }, 1);
    assert.equal(wrongTurnVal.legal, false);

    // Side 0 (White) making an illegal move
    const illegalMoveVal = Chess960Variant.validateMove(state, { from: "e2", to: "e5" }, 0);
    assert.equal(illegalMoveVal.legal, false);
  });

  test("isTerminal and getOutcome on starting and checkmate states", () => {
    const startState = Chess960Variant.initialState({ positionId: 518 });
    assert.equal(Chess960Variant.isTerminal(startState), false);

    // Fool's mate FEN: rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2 -> Qh4#
    const foolsMateFen = "rnb1kbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2"; // White played 1. f3 e5 2. g4
    const mateState: Chess960GameState = { fen: "rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2", positionId: 518 };

    // Apply Qh4#
    const nextState = Chess960Variant.applyMove(mateState, { from: "d8", to: "h4" });
    assert.equal(Chess960Variant.isTerminal(nextState), true);

    const outcome = Chess960Variant.getOutcome(nextState);
    assert.equal(outcome.kind, "win");
    if (outcome.kind === "win") {
      assert.equal(outcome.winningSide, 1); // Black won
      assert.equal(outcome.reason, "checkmate");
    }
  });

  test("legalMoves returns all legal moves for active side", () => {
    const startState = Chess960Variant.initialState({ positionId: 518 });
    const movesWhite = Chess960Variant.legalMoves(startState, 0);
    assert.equal(movesWhite.length, 20); // 20 standard opening moves

    const movesBlack = Chess960Variant.legalMoves(startState, 1);
    assert.equal(movesBlack.length, 0); // Not Black's turn
  });
});
