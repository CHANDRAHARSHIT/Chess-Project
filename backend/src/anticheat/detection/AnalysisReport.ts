/**
 * Renders a GameAnalysisReport as plain text.
 *
 * Text because there is no frontend for this yet — it is readable in a terminal,
 * a log line, and a curl response without any client work.
 */

import type { ClassifiedMove, MoveQuality } from "./BlunderAnalyzer.js";
import type { GameAnalysisReport } from "./PostGameAnalysis.js";

const SIDE_NAMES = ["White", "Black"];

/** Only these appear in the mistake list; "good" and "best" are noise there. */
const NOTABLE: readonly MoveQuality[] = ["blunder", "mistake", "inaccuracy"];

/** Above this, an eval came from a forced mate rather than a material count. */
const MATE_EVAL_FLOOR_CP = 9000;

export function renderTextReport(report: GameAnalysisReport): string {
  const lines: string[] = [];
  const rule = "=".repeat(64);

  lines.push(rule);
  lines.push("POST-GAME ANALYSIS");
  lines.push(rule);
  lines.push(`Game:       ${report.gameRecordId}`);
  lines.push(`Variant:    ${report.variantId}`);
  lines.push(`Result:     ${describeResult(report)}`);
  lines.push(`Analysed:   ${report.analysedAt.toISOString()} at depth ${report.depth}`);
  lines.push("");

  for (const summary of report.summaries) {
    const player = report.participants.find((p) => p.side === summary.side);
    const label = `${sideName(summary.side)}${player?.name ? ` (${player.name})` : ""}`;

    lines.push(`--- ${label} `.padEnd(64, "-"));
    lines.push(`  Accuracy:            ${summary.accuracy.toFixed(1)}%`);
    lines.push(`  Moves analysed:      ${summary.movesAnalysed}`);
    lines.push(`  Blunders:            ${summary.blunders}`);
    lines.push(`  Mistakes:            ${summary.mistakes}`);
    lines.push(`  Inaccuracies:        ${summary.inaccuracies}`);
    lines.push(`  Avg centipawn loss:  ${summary.averageCentipawnLoss}`);
    lines.push(`  Engine-best moves:   ${(summary.bestMoveRate * 100).toFixed(1)}%`);
    lines.push(`  Longest best streak: ${summary.longestEngineBestStreak}`);
    if (summary.worstMove) {
      lines.push(`  Worst move:          ${formatMove(summary.worstMove)}`);
    }
    lines.push("");
  }

  if (report.turningPoint) {
    const tp = report.turningPoint;
    lines.push(`--- Turning point `.padEnd(64, "-"));
    lines.push(
      `  ${sideName(tp.favouredSide)} was decisively ahead from ` +
        `${tp.moveNumber}${tp.side === 0 ? "." : "..."} ${tp.san} onward ` +
        `(${formatEval(tp.evalCp)}).`
    );
    lines.push("");
  }

  const notable = report.moves.filter((m) => NOTABLE.includes(m.quality));
  lines.push(`--- Mistakes (${notable.length}) `.padEnd(64, "-"));
  if (notable.length === 0) {
    lines.push("  None. No move lost enough evaluation to be flagged.");
  } else {
    for (const move of notable) {
      lines.push(`  ${formatMove(move)}`);
    }
  }
  lines.push("");
  lines.push(rule);

  return lines.join("\n");
}

function formatMove(move: ClassifiedMove): string {
  const number = `${move.moveNumber}${move.side === 0 ? "." : "..."}`;
  const quality = move.quality.toUpperCase().padEnd(10);
  const loss = `-${move.centipawnLoss}cp`.padStart(8);
  const better = move.bestMove ? `  (engine: ${move.bestMove})` : "";
  return `${number.padEnd(6)} ${move.san.padEnd(8)} ${quality} ${loss}${better}`;
}

function describeResult(report: GameAnalysisReport): string {
  const winner =
    report.winningSide === null ? "draw" : `${sideName(report.winningSide)} wins`;
  return `${winner} by ${report.terminationReason}`;
}

function sideName(side: number): string {
  return SIDE_NAMES[side] ?? `Side ${side}`;
}

/**
 * Evaluations are conventionally shown in pawns from White's point of view.
 * Mate is collapsed into the centipawn scale upstream (~±10000), which would
 * otherwise render as a meaningless "+100.0 pawns".
 */
function formatEval(cp: number): string {
  if (Math.abs(cp) >= MATE_EVAL_FLOOR_CP) return cp > 0 ? "mate for White" : "mate for Black";
  const pawns = (cp / 100).toFixed(1);
  return cp > 0 ? `+${pawns}` : pawns;
}
