/**
 * extract.ts
 * FIDE Classical Game Extraction — main entry point.
 *
 * Usage:
 *   npx tsx scripts/fide-extraction/extract.ts --fide-id 2016192
 *
 * Reads PGN files from data/pgn-archive/, filters for classical games
 * of the specified player, and writes results to data/extracted/{fide_id}_classical.pgn.
 *
 * This is extraction only — no integration with OpponentService,
 * opponentGames.json, database, Prisma, or any existing app logic.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Chess } from 'chess.js';
import { findPlayerByFideId } from './players.js';
import { splitPgnFile } from './pgn-splitter.js';
import { matchPlayer, classicalFilter } from './filters.js';
import type { PlayerMatchResult, ClassicalFilterResult } from './filters.js';

// ─── CLI Args ──────────────────────────────────────────────────────

function parseArgs(): { fideId: number } {
  const args = process.argv.slice(2);
  const fideIdIdx = args.indexOf('--fide-id');

  if (fideIdIdx === -1 || !args[fideIdIdx + 1]) {
    console.error('Usage: npx tsx scripts/fide-extraction/extract.ts --fide-id <FIDE_ID>');
    process.exit(1);
  }

  const fideId = parseInt(args[fideIdIdx + 1], 10);
  if (isNaN(fideId)) {
    console.error(`Invalid FIDE ID: ${args[fideIdIdx + 1]}`);
    process.exit(1);
  }

  return { fideId };
}


// ─── Header Extraction (lightweight, no full move parsing) ─────────

/**
 * Extract PGN headers without parsing the full game through chess.js.
 * This is much faster for the filtering pass — we only need headers.
 */
function extractHeaders(pgnString: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const lines = pgnString.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // PGN headers are [Key "Value"]
    const match = trimmed.match(/^\[(\w+)\s+"(.*)"\]$/);
    if (match) {
      headers[match[1]] = match[2];
    }
    // Stop at the first non-header, non-blank line (movetext)
    if (trimmed && !trimmed.startsWith('[')) break;
  }

  return headers;
}


// ─── Main ──────────────────────────────────────────────────────────

export function extractFideGames(fideId: number) {
  // 1. Resolve player
  const player = findPlayerByFideId(fideId);
  if (!player) {
    throw new Error(`FIDE ID ${fideId} not found in data/players.json. Add this player to the alias table first.`);
  }

  const ARCHIVE_DIR = path.join(process.cwd(), 'data', 'pgn-archive');
  const OUTPUT_DIR = path.join(process.cwd(), 'data', 'extracted');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 2. Read PGN files
  if (!fs.existsSync(ARCHIVE_DIR)) {
    throw new Error(`Archive directory not found: ${ARCHIVE_DIR}`);
  }

  const pgnFiles = fs.readdirSync(ARCHIVE_DIR).filter(f => f.endsWith('.pgn'));
  if (pgnFiles.length === 0) {
    throw new Error(`No .pgn files found in ${ARCHIVE_DIR}`);
  }

  // Tracking counters
  let totalGames = 0;
  let playerMatched = 0;
  let classicalPassed = 0;
  let duplicatesSkipped = 0;

  // Match method breakdown
  let matchedByFideId = 0;
  let matchedByAlias = 0;

  // Exclusion breakdown
  let noPlayerMatch = 0;
  let excludedTcTooLow = 0;
  let excludedEventType = 0;
  let passedByTc = 0;
  let passedByEventInclude = 0;
  let passedByEventDefault = 0;

  // Dedup set (SHA-256 hash of raw PGN text)
  const seenHashes = new Set<string>();

  // Collected output games
  const outputGames: string[] = [];

  // 3. Process each PGN file
  for (const filename of pgnFiles) {
    const filePath = path.join(ARCHIVE_DIR, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const games = splitPgnFile(fileContent);

    for (const gamePgn of games) {
      totalGames++;

      // Extract headers (lightweight, no move parsing)
      const headers = extractHeaders(gamePgn);

      // Player match (FIDE ID first, alias fallback)
      const playerResult: PlayerMatchResult = matchPlayer(
        headers,
        player.fide_id,
        player.aliases
      );

      if (!playerResult.matched) {
        noPlayerMatch++;
        continue;
      }

      playerMatched++;

      if (playerResult.method === 'fide_id') {
        matchedByFideId++;
      } else {
        matchedByAlias++;
      }

      // Classical filter (cascading TC → event name → site/platform)
      const eventName = headers['Event'] || '';
      const siteName = headers['Site'] || '';
      const timeControl = headers['TimeControl'] || null;
      const filterResult: ClassicalFilterResult = classicalFilter(timeControl, eventName, siteName);

      if (!filterResult.passed) {
        if (filterResult.method === 'time_control') {
          excludedTcTooLow++;
        } else {
          excludedEventType++;
        }
        continue;
      }

      // Track how it passed
      if (filterResult.method === 'time_control') passedByTc++;
      else if (filterResult.method === 'event_include') passedByEventInclude++;
      else if (filterResult.method === 'event_default') passedByEventDefault++;

      // Duplicate detection (SHA-256 of raw PGN text)
      const pgnHash = crypto.createHash('sha256').update(gamePgn.trim()).digest('hex');
      if (seenHashes.has(pgnHash)) {
        duplicatesSkipped++;
        continue;
      }
      seenHashes.add(pgnHash);

      classicalPassed++;
      outputGames.push(gamePgn);
    }
  }

  // 4. Write output
  const outputFile = path.join(OUTPUT_DIR, `${fideId}_classical.pgn`);
  const outputContent = outputGames.join('\n\n') + '\n';
  fs.writeFileSync(outputFile, outputContent, 'utf-8');

  return {
    player,
    pgnFilesCount: pgnFiles.length,
    outputFile,
    games: outputGames,
    stats: {
      totalGames,
      playerMatched,
      classicalPassed,
      duplicatesSkipped,
      matchedByFideId,
      matchedByAlias,
      noPlayerMatch,
      excludedTcTooLow,
      excludedEventType,
      passedByTc,
      passedByEventInclude,
      passedByEventDefault
    }
  };
}

function main() {
  const { fideId } = parseArgs();

  try {
    const result = extractFideGames(fideId);
    
    console.log('');
    console.log('══════════════════════════════════════════════════');
    console.log('  FIDE Classical Game Extraction');
    console.log('══════════════════════════════════════════════════');
    console.log(`  Player:  ${result.player.canonical_name} (FIDE ${result.player.fide_id})`);
    console.log(`  Aliases: ${result.player.aliases.join(' | ')}`);
    console.log(`  Source:  ${result.pgnFilesCount} PGN file(s) in data/pgn-archive/`);
    console.log('──────────────────────────────────────────────────');
    console.log(`  Total games parsed:            ${result.stats.totalGames.toLocaleString().padStart(6)}`);
    console.log(`  Player matched:                ${result.stats.playerMatched.toString().padStart(6)}`);
    console.log(`  Classical filter passed:        ${result.stats.classicalPassed.toString().padStart(6)}`);
    console.log(`  Duplicates skipped:             ${result.stats.duplicatesSkipped.toString().padStart(6)}`);
    console.log('──────────────────────────────────────────────────');
    console.log('  Match method breakdown:');
    console.log(`    Matched by FIDE ID:           ${result.stats.matchedByFideId.toString().padStart(6)}`);
    console.log(`    Matched by alias (fallback):  ${result.stats.matchedByAlias.toString().padStart(6)}`);
    console.log('──────────────────────────────────────────────────');
    console.log('  Exclusion breakdown:');
    console.log(`    No player match:              ${result.stats.noPlayerMatch.toLocaleString().padStart(6)}`);
    console.log(`    Time control too low:         ${result.stats.excludedTcTooLow.toString().padStart(6)}`);
    console.log(`    Excluded event type:          ${result.stats.excludedEventType.toString().padStart(6)}`);
    console.log('  Inclusion breakdown:');
    console.log(`    Classical by time control:    ${result.stats.passedByTc.toString().padStart(6)}`);
    console.log(`    Classical by event name:      ${result.stats.passedByEventInclude.toString().padStart(6)}`);
    console.log(`    Unclassified (default incl.): ${result.stats.passedByEventDefault.toString().padStart(6)}`);
    console.log('──────────────────────────────────────────────────');
    console.log(`  Output: ${path.relative(process.cwd(), result.outputFile)}`);
    console.log(`  (${result.stats.classicalPassed} unique games written)`);
    console.log('══════════════════════════════════════════════════');
    console.log('');

    if (result.games.length > 0) {
      console.log('  ── Sample: first extracted game ──');
      const sampleHeaders = extractHeaders(result.games[0]);
      for (const [key, value] of Object.entries(sampleHeaders)) {
        console.log(`    [${key} "${value}"]`);
      }
      console.log('');
    }
  } catch (error: any) {
    console.error(`\n  ✗ ${error.message}\n`);
    process.exit(1);
  }
}

// Only run main if this file is executed directly (via CLI)
// In ES modules, we check if import.meta.url matches the file URL, but for Node/CommonJS compat:
import { fileURLToPath } from 'url';
const isMain = import.meta.url ? fileURLToPath(import.meta.url) === process.argv[1] : require.main === module;

if (isMain || (process.argv[1] && process.argv[1].endsWith('extract.ts'))) {
  main();
}
