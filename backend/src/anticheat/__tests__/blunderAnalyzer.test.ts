import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { BlunderAnalyzer } from "../detection/BlunderAnalyzer.js";
import { PolicyRegistry } from "../feedback/PolicyRegistry.js";
import { renderTextReport } from "../detection/AnalysisReport.js";
import { parseStoredMoves } from "../detection/GameReplay.js";
import { startingFenFromMetadata } from "../detection/PostGameAnalysis.js";
import type { AnalyzedMove, Situation } from "../types.js";

const SITUATION: Situation = { proficiency: "unknown", eventType: "unrated_game" };

/** Builds a move whose centipawn loss is exactly `loss`. */
function move(ply: number, loss: number, overrides: Partial<AnalyzedMove> = {}): AnalyzedMove {
  return {
    ply,
    side: ply % 2,
    fenBefore: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    san: "e4",
    uci: "e2e4",
    thinkTimeMs: 0,
    clockRemainingMs: 0,
    evalBeforeCp: 0,
    evalAfterCp: -loss,
    engineBestMoves: ["d2d4"],
    ...overrides,
  };
}

describe("BlunderAnalyzer", () => {
  const analyzer = new BlunderAnalyzer(new PolicyRegistry());

  it("classifies moves into quality bands by centipawn loss", () => {
    const classified = analyzer.classify(
      [move(0, 0), move(1, 60), move(2, 200), move(3, 500)],
      SITUATION
    );

    assert.deepEqual(
      classified.map((m) => m.quality),
      ["best", "inaccuracy", "mistake", "blunder"]
    );
  });

  it("treats an improving move as zero loss rather than negative", () => {
    const [classified] = analyzer.classify(
      [move(0, 0, { evalBeforeCp: -50, evalAfterCp: 120 })],
      SITUATION
    );

    assert.equal(classified.centipawnLoss, 0);
  });

  it("clamps mate-sized losses so one move cannot distort the average", () => {
    // Allowing mate scores ~10000cp. Unclamped, the average below would be ~5000.
    const classified = analyzer.classify([move(0, 0), move(2, 10_000)], SITUATION);
    const summary = analyzer.summarise(classified, 0);

    assert.equal(classified[1].centipawnLoss, 1000);
    assert.equal(summary.averageCentipawnLoss, 500);
  });

  it("counts a move matching the engine's first choice as best despite some loss", () => {
    const [classified] = analyzer.classify(
      [move(0, 30, { uci: "d2d4", engineBestMoves: ["d2d4"] })],
      SITUATION
    );

    assert.equal(classified.quality, "best");
  });

  it("ignores the promotion suffix when matching against the engine's move", () => {
    const [classified] = analyzer.classify(
      [move(0, 0, { uci: "e7e8q", engineBestMoves: ["e7e8"] })],
      SITUATION
    );

    assert.equal(classified.quality, "best");
  });

  it("skips moves the engine never evaluated", () => {
    const classified = analyzer.classify(
      [move(0, 100), move(1, 0, { evalBeforeCp: undefined, evalAfterCp: undefined })],
      SITUATION
    );

    assert.equal(classified.length, 1);
  });

  it("summarises only the requested side", () => {
    // Ply 0 and 2 are White; ply 1 and 3 are Black.
    const classified = analyzer.classify(
      [move(0, 500), move(1, 0), move(2, 200), move(3, 0)],
      SITUATION
    );

    const white = analyzer.summarise(classified, 0);
    const black = analyzer.summarise(classified, 1);

    assert.equal(white.movesAnalysed, 2);
    assert.equal(white.blunders, 1);
    assert.equal(white.mistakes, 1);
    assert.equal(black.blunders, 0);
    assert.equal(black.movesAnalysed, 2);
  });

  it("reports the single worst move", () => {
    const classified = analyzer.classify([move(0, 120), move(2, 640), move(4, 300)], SITUATION);
    const summary = analyzer.summarise(classified, 0);

    assert.equal(summary.worstMove?.centipawnLoss, 640);
  });

  it("returns zeroed figures rather than NaN for a side with no moves", () => {
    const summary = analyzer.summarise([], 0);

    assert.equal(summary.movesAnalysed, 0);
    assert.equal(summary.averageCentipawnLoss, 0);
    assert.equal(summary.bestMoveRate, 0);
  });
});

describe("parseStoredMoves", () => {
  it("reads well-formed moves and keeps promotions", () => {
    const moves = parseStoredMoves([
      { from: "e2", to: "e4" },
      { from: "e7", to: "e8", promotion: "q" },
    ]);

    assert.deepEqual(moves, [
      { from: "e2", to: "e4" },
      { from: "e7", to: "e8", promotion: "q" },
    ]);
  });

  it("drops malformed entries instead of throwing on untrusted JSON", () => {
    assert.deepEqual(parseStoredMoves([{ from: "e2" }, null, "e4", { to: "e4" }, 7]), []);
    assert.deepEqual(parseStoredMoves(null), []);
    assert.deepEqual(parseStoredMoves({}), []);
  });
});

describe("startingFenFromMetadata", () => {
  const generate = (id: number) => `fen-for-${id}`;

  it("resolves a valid positionId", () => {
    assert.equal(startingFenFromMetadata({ positionId: 518 }, generate), "fen-for-518");
    assert.equal(startingFenFromMetadata({ positionId: 0 }, generate), "fen-for-0");
    assert.equal(startingFenFromMetadata({ positionId: 959 }, generate), "fen-for-959");
  });

  it("returns null for games recorded before positionId was captured", () => {
    assert.equal(startingFenFromMetadata(null, generate), null);
    assert.equal(startingFenFromMetadata({}, generate), null);
  });

  it("rejects out-of-range and non-integer ids rather than generating a bad board", () => {
    assert.equal(startingFenFromMetadata({ positionId: -1 }, generate), null);
    assert.equal(startingFenFromMetadata({ positionId: 960 }, generate), null);
    assert.equal(startingFenFromMetadata({ positionId: 1.5 }, generate), null);
    assert.equal(startingFenFromMetadata({ positionId: "518" }, generate), null);
  });
});

describe("renderTextReport", () => {
  const analyzer = new BlunderAnalyzer(new PolicyRegistry());
  const classified = analyzer.classify([move(0, 500), move(1, 20)], SITUATION);

  const report = {
    gameRecordId: "game-1",
    variantId: "chess960",
    startingFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    analysedAt: new Date("2026-01-01T00:00:00.000Z"),
    depth: 12,
    moves: classified,
    summaries: [analyzer.summarise(classified, 0), analyzer.summarise(classified, 1)],
    participants: [
      { userId: "u1", side: 0, name: "Alice" },
      { userId: "u2", side: 1, name: "Bob" },
    ],
    terminationReason: "checkmate",
    outcomeKind: "win",
    winningSide: 1,
  };

  it("names both players and the result", () => {
    const text = renderTextReport(report);

    assert.match(text, /White \(Alice\)/);
    assert.match(text, /Black \(Bob\)/);
    assert.match(text, /Black wins by checkmate/);
  });

  it("lists notable moves and excludes clean ones", () => {
    const text = renderTextReport(report);

    assert.match(text, /BLUNDER/);
    assert.doesNotMatch(text, /\bBEST\b/);
  });

  it("says so explicitly when nothing was flagged", () => {
    const clean = analyzer.classify([move(0, 0), move(1, 0)], SITUATION);
    const text = renderTextReport({
      ...report,
      moves: clean,
      summaries: [analyzer.summarise(clean, 0), analyzer.summarise(clean, 1)],
    });

    assert.match(text, /None\. No move lost enough evaluation to be flagged\./);
  });

  it("renders a draw without naming a winner", () => {
    const text = renderTextReport({ ...report, winningSide: null, terminationReason: "stalemate" });

    assert.match(text, /draw by stalemate/);
  });
});
