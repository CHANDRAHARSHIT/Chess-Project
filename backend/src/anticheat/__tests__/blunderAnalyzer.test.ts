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
    assert.equal(summary.accuracy, 0);
    assert.equal(summary.longestEngineBestStreak, 0);
  });
});

describe("BlunderAnalyzer — accuracy", () => {
  const analyzer = new BlunderAnalyzer(new PolicyRegistry());
  const accuracyOf = (before: number, after: number) =>
    analyzer.classify([move(0, 0, { evalBeforeCp: before, evalAfterCp: after })], SITUATION)[0]
      .accuracy;

  it("scores a move that loses nothing as 100", () => {
    assert.equal(accuracyOf(50, 50), 100);
  });

  it("scores a move that improves the position as 100 rather than above it", () => {
    assert.equal(accuracyOf(0, 300), 100);
  });

  it("falls as the move gives away more of the win probability", () => {
    const small = accuracyOf(0, -50);
    const large = accuracyOf(0, -500);

    // A 50cp slip from level costs ~4.6 win percentage points, scoring ~81 on
    // the Lichess curve. Single-move accuracy is harsher than a game average,
    // where most moves score at or near 100.
    assert.ok(small > large, `expected ${small} > ${large}`);
    assert.ok(small > 75 && small < 90, `small loss scored ${small}`);
    assert.ok(large < 40, `large loss scored ${large}`);
  });

  it("stays within 0–100 even for a mate-sized swing", () => {
    const accuracy = accuracyOf(0, -10_000);

    assert.ok(accuracy >= 0 && accuracy <= 100, `accuracy was ${accuracy}`);
  });

  it("penalises the same centipawn loss less when the position is already won", () => {
    // 100cp given away from level matters more than from +900. Raw centipawn
    // loss cannot see this difference; win percentage can.
    const fromLevel = accuracyOf(0, -100);
    const fromWinning = accuracyOf(900, 800);

    assert.ok(fromWinning > fromLevel, `expected ${fromWinning} > ${fromLevel}`);
  });
});

describe("BlunderAnalyzer — engine-best streak", () => {
  const analyzer = new BlunderAnalyzer(new PolicyRegistry());
  /** White moves (even plies) that either match the engine or do not. */
  const run = (matches: boolean[]) =>
    analyzer.classify(
      matches.map((matched, i) =>
        move(i * 2, 0, {
          uci: matched ? "d2d4" : "h2h3",
          engineBestMoves: ["d2d4"],
        })
      ),
      SITUATION
    );

  it("counts the longest consecutive run, not the total", () => {
    const summary = analyzer.summarise(run([true, true, false, true, true, true]), 0);

    assert.equal(summary.longestEngineBestStreak, 3);
    assert.equal(summary.bestMoveRate, 5 / 6);
  });

  it("is zero when no move matched", () => {
    assert.equal(analyzer.summarise(run([false, false]), 0).longestEngineBestStreak, 0);
  });

  it("counts a fully matching game as one unbroken streak", () => {
    assert.equal(analyzer.summarise(run([true, true, true]), 0).longestEngineBestStreak, 3);
  });

  it("excludes low-loss moves that did not match the engine", () => {
    // A 5cp loss is classified "best" by band, but it is not an engine match —
    // counting it would overstate correlation, which is a cheating signal.
    const classified = analyzer.classify(
      [move(0, 5, { uci: "h2h3", engineBestMoves: ["d2d4"] })],
      SITUATION
    );
    const summary = analyzer.summarise(classified, 0);

    assert.equal(classified[0].quality, "best");
    assert.equal(classified[0].matchedEngineBest, false);
    assert.equal(summary.bestMoveRate, 0);
  });
});

describe("BlunderAnalyzer — turning point", () => {
  const analyzer = new BlunderAnalyzer(new PolicyRegistry());

  /** Builds plies from White-perspective evals, alternating sides. */
  const fromWhiteEvals = (evals: number[]) =>
    analyzer.classify(
      evals.map((whiteCp, ply) =>
        move(ply, 0, {
          evalBeforeCp: 0,
          // Stored per-mover, so Black's plies are negated.
          evalAfterCp: ply % 2 === 0 ? whiteCp : -whiteCp,
        })
      ),
      SITUATION
    );

  it("is absent when the game stays competitive", () => {
    assert.equal(analyzer.findTurningPoint(fromWhiteEvals([10, -20, 50, 0]), SITUATION), undefined);
  });

  it("reports the move the advantage became decisive", () => {
    const tp = analyzer.findTurningPoint(fromWhiteEvals([0, 0, 500, 600, 700]), SITUATION);

    assert.equal(tp?.ply, 2);
    assert.equal(tp?.favouredSide, 0);
  });

  it("ignores a lead that is given back", () => {
    // Decisive at ply 1, level again at 2, decisive again at 3 — the real
    // turning point is the last one, not the first.
    const tp = analyzer.findTurningPoint(fromWhiteEvals([0, 500, 20, 600, 700]), SITUATION);

    assert.equal(tp?.ply, 3);
  });

  it("attributes the advantage to Black when Black is winning", () => {
    const tp = analyzer.findTurningPoint(fromWhiteEvals([0, -500, -600]), SITUATION);

    assert.equal(tp?.favouredSide, 1);
    assert.ok(tp!.evalCp < 0);
  });

  it("records the side that played the move, not the side it favoured", () => {
    // Black's ply 1 hands White a decisive advantage. The move must be notated
    // as Black's ("3...Nf6"), while the advantage belongs to White.
    const tp = analyzer.findTurningPoint(fromWhiteEvals([0, 500, 600]), SITUATION);

    assert.equal(tp?.side, 1);
    assert.equal(tp?.favouredSide, 0);
  });

  it("restarts when the advantage changes hands", () => {
    const tp = analyzer.findTurningPoint(fromWhiteEvals([500, 600, -500, -600]), SITUATION);

    assert.equal(tp?.favouredSide, 1);
    assert.equal(tp?.ply, 2);
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
  const analysedMoves = [move(0, 500), move(1, 20)];
  const classified = analyzer.classify(analysedMoves, SITUATION);

  const report = {
    analysedMoves,
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

  it("reports accuracy and the engine-best streak per side", () => {
    const text = renderTextReport(report);

    assert.match(text, /Accuracy:\s+\d+\.\d%/);
    assert.match(text, /Longest best streak:\s+\d+/);
  });

  it("notates the turning point by the side that played it", () => {
    const text = renderTextReport({
      ...report,
      turningPoint: {
        ply: 1,
        moveNumber: 3,
        san: "Nf6",
        side: 1,
        favouredSide: 0,
        evalCp: 600,
      },
    });

    assert.match(text, /White was decisively ahead from 3\.\.\. Nf6 onward \(\+6\.0\)/);
  });

  it("renders a mate-scale evaluation as mate rather than 100 pawns", () => {
    const text = renderTextReport({
      ...report,
      turningPoint: {
        ply: 1,
        moveNumber: 3,
        san: "Nf6",
        side: 1,
        favouredSide: 0,
        evalCp: 10_000,
      },
    });

    assert.match(text, /mate for White/);
    assert.doesNotMatch(text, /\+100\.0/);
  });

  it("omits the turning point section when the game stayed competitive", () => {
    assert.doesNotMatch(renderTextReport(report), /Turning point/);
  });
});
