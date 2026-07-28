import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Chess } from 'chess.js';
import { EngineService } from './engine.service.js';

const DATA_FILE = path.join(process.cwd(), 'data', 'opponentGames.json');
const ECO_FILE = path.join(process.cwd(), 'data', 'ecoOpenings.json');
const MIN_GAMES = 3;
const MIN_GAMES_FOR_AVOIDED_OPENINGS = 50;

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

interface EcoOpening {
  eco: string;
  name: string;
  moves: string[];
}

let ecoOpenings: EcoOpening[] = [];
try {
  if (fs.existsSync(ECO_FILE)) {
    ecoOpenings = JSON.parse(fs.readFileSync(ECO_FILE, 'utf-8'));
  }
} catch (e) {
  console.error("Failed to load ECO openings", e);
}

function classifyOpening(gameMoves: { san: string }[]): { eco: string; name: string } | null {
  if (ecoOpenings.length === 0) return null;
  let bestMatch: { eco: string; name: string } | null = null;
  let maxPrefixLength = 0;

  for (const op of ecoOpenings) {
    if (op.moves.length > gameMoves.length) continue;
    if (op.moves.length < maxPrefixLength) continue;

    let match = true;
    for (let i = 0; i < op.moves.length; i++) {
      if (op.moves[i] !== gameMoves[i].san) {
        match = false;
        break;
      }
    }

    if (match && op.moves.length > maxPrefixLength) {
      maxPrefixLength = op.moves.length;
      bestMatch = { eco: op.eco, name: op.name };
    }
  }
  return bestMatch;
}

function parseClock(comment: string): number | null {
  const match = comment.match(/\[%clk\s+(\d+):(\d+):(\d+(?:\.\d+)?)\]/);
  if (match) {
    return parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseFloat(match[3]);
  }
  return null;
}

function parseTimeControl(tc: string | null): { base: number, inc: number } | null {
  if (!tc) return null;
  const match = tc.match(/^(\d+)(?:\+(\d+))?$/);
  if (match) {
    return { base: parseInt(match[1], 10), inc: match[2] ? parseInt(match[2], 10) : 0 };
  }
  return null;
}

function getPhase(fen: string, ply: number): "opening" | "middlegame" | "endgame" {
  const pieces = fen.split(' ')[0];
  let material = 0;
  for (const char of pieces) {
    if (char === 'Q' || char === 'q') material += 9;
    else if (char === 'R' || char === 'r') material += 5;
    else if (char === 'B' || char === 'b') material += 3;
    else if (char === 'N' || char === 'n') material += 3;
  }
  if (material <= 24) return "endgame";
  if (ply < 20) return "opening";
  return "middlegame";
}

export interface OpponentGame {
  pgnHash: string;
  normalizedUsername: string;
  opponentColor: 'w' | 'b' | 'unknown';
  opponentRating: number | null;
  result: string;
  opponentResult: 'win' | 'loss' | 'draw' | 'unknown';
  timeControl: string | null;
  moves: { san: string; clock?: number }[];
  rawPgn: string;
  opening: { eco: string; name: string } | null;
  evaluations?: { ply: number, fen: string, evaluation: number | null, mateIn: number | null, evaluationWhitePerspective: number | null, mateInWhitePerspective: number | null, bestMove: string }[];
}

function loadAllGames(): Record<string, OpponentGame[]> {
  if (!fs.existsSync(DATA_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading opponent games file", err);
    return {};
  }
}

function saveAllGames(data: Record<string, OpponentGame[]>) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

const CACHE_FILE = path.join(process.cwd(), 'data', 'multiPvCache.json');

function loadMultiPvCache(): Record<string, any[]> {
  if (!fs.existsSync(CACHE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveMultiPvCache(cache: Record<string, any[]>) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

let multiPvCache = loadMultiPvCache();

export const OpponentService = {
  getMultiPvCache(fen: string) {
    return multiPvCache[fen] || null;
  },
  
  setMultiPvCache(fen: string, results: any[]) {
    multiPvCache[fen] = results;
    saveMultiPvCache(multiPvCache);
  },

  ingestGames(username: string, pgns: string[]) {
    const normalizedUsername = username.trim().toLowerCase();
    const allGames = loadAllGames();
    
    if (!allGames[normalizedUsername]) {
      allGames[normalizedUsername] = [];
    }

    const existingHashes = new Set(allGames[normalizedUsername].map(g => g.pgnHash));
    let ingested = 0;
    let skipped = 0;

    for (const pgn of pgns) {
      const trimmedPgn = pgn.trim();
      if (!trimmedPgn) continue;

      const pgnHash = crypto.createHash('sha256').update(trimmedPgn).digest('hex');
      if (existingHashes.has(pgnHash)) {
        skipped++;
        continue;
      }

      const chess = new Chess();
      try {
        chess.loadPgn(trimmedPgn);
      } catch (err) {
        console.error("Failed to parse PGN", err);
        skipped++;
        continue;
      }

      const header = chess.header();
      
      const whitePlayer = (header['White'] || '').toLowerCase();
      const blackPlayer = (header['Black'] || '').toLowerCase();
      
      let opponentColor: 'w' | 'b' | 'unknown' = 'unknown';
      let opponentRating: number | null = null;

      // Word-based matching: split username into words and check all appear in the player name.
      // This handles "Nakamura, Hikaru" matching input "Hikaru Nakamura" (reversed/comma-separated).
      const usernameWords = normalizedUsername.split(/[\s,]+/).filter(Boolean);
      const playerMatches = (playerName: string) => {
        // First try exact substring match (handles single-word usernames like "Hikaru")
        if (playerName.includes(normalizedUsername)) return true;
        // Then try: every word in the input appears somewhere in the player name
        return usernameWords.length > 1 && usernameWords.every(word => playerName.includes(word));
      };

      const matchesWhite = playerMatches(whitePlayer);
      const matchesBlack = playerMatches(blackPlayer);

      if (matchesWhite && !matchesBlack) {
        opponentColor = 'w';
        opponentRating = header['WhiteElo'] ? parseInt(header['WhiteElo'], 10) : null;
      } else if (matchesBlack && !matchesWhite) {
        opponentColor = 'b';
        opponentRating = header['BlackElo'] ? parseInt(header['BlackElo'], 10) : null;
      }

      // If we couldn't confidently determine the color, skip this game
      if (opponentColor === 'unknown') {
        skipped++;
        continue;
      }

      if (Number.isNaN(opponentRating)) opponentRating = null;

      const rawResult = header['Result'] || '*';
      let opponentResult: 'win' | 'loss' | 'draw' | 'unknown' = 'unknown';

      if (rawResult === '1/2-1/2') {
        opponentResult = 'draw';
      } else if (rawResult === '1-0') {
        if (opponentColor === 'w') opponentResult = 'win';
        else if (opponentColor === 'b') opponentResult = 'loss';
      } else if (rawResult === '0-1') {
        if (opponentColor === 'b') opponentResult = 'win';
        else if (opponentColor === 'w') opponentResult = 'loss';
      }

      const comments = (chess as any).getComments ? (chess as any).getComments() : [];
      const commentMap = new Map<string, string>();
      for (const c of comments) {
        commentMap.set(c.fen, c.comment);
      }

      const history = chess.history({ verbose: true });
      const moves = history.map((m: any) => {
        let clock: number | undefined = undefined;
        const comment = commentMap.get(m.after);
        if (comment) {
          const parsed = parseClock(comment);
          if (parsed !== null) clock = parsed;
        }
        return { san: m.san, clock };
      });

      const opening = classifyOpening(moves);

      const game: OpponentGame = {
        pgnHash,
        normalizedUsername,
        opponentColor,
        opponentRating,
        result: rawResult,
        opponentResult,
        timeControl: header['TimeControl'] || null,
        moves,
        rawPgn: trimmedPgn,
        opening
      };

      allGames[normalizedUsername].push(game);
      existingHashes.add(pgnHash);
      ingested++;
    }

    saveAllGames(allGames);
    return { ingested, skipped };
  },

  backfillOpenings() {
    const allGames = loadAllGames();
    let updatedAny = false;
    
    for (const [username, games] of Object.entries(allGames)) {
      for (const game of games) {
        if (!game.opening) {
          const opening = classifyOpening(game.moves);
          if (opening) {
            game.opening = opening;
            updatedAny = true;
          }
        }
      }
    }

    if (updatedAny) {
      saveAllGames(allGames);
    }
  },

  async backfillClocksAndEvals() {
    const allGames = loadAllGames();
    let updatedAny = false;
    
    for (const [username, games] of Object.entries(allGames)) {
      for (let i = 0; i < games.length; i++) {
        const game = games[i];
        let updated = false;

        // Check if clocks are missing
        const hasClocks = game.moves.some(m => m.clock !== undefined);
        if (!hasClocks && game.rawPgn) {
          try {
            const chess = new Chess();
            chess.loadPgn(game.rawPgn);
            const comments = (chess as any).getComments ? (chess as any).getComments() : [];
            const commentMap = new Map<string, string>();
            for (const c of comments) {
              commentMap.set(c.fen, c.comment);
            }
            const history = chess.history({ verbose: true });
            
            for (let j = 0; j < history.length; j++) {
              if (game.moves[j]) {
                const comment = commentMap.get(history[j].after);
                if (comment) {
                  const parsed = parseClock(comment);
                  if (parsed !== null) {
                    game.moves[j].clock = parsed;
                    updated = true;
                  }
                }
              }
            }
          } catch (e) {
            // ignore parse errors during backfill
          }
        }
        
        if (!game.evaluations) {
          try {
             game.evaluations = await EngineService.evaluateGame(game.moves);
             updated = true;
          } catch(e) {
             console.error("Failed to evaluate game", e);
          }
        }

        if (updated) {
          updatedAny = true;
        }
      }
    }

    if (updatedAny) {
      saveAllGames(allGames);
    }
  },

  getGames(username: string): OpponentGame[] {
    const allGames = loadAllGames();
    return allGames[username.trim().toLowerCase()] || [];
  },

  getStats(username: string) {
    const games = this.getGames(username);
    const openingStats: Record<string, { eco: string, name: string, count: number, wins: number, draws: number, losses: number }> = {};
    
    let classifiedGames = 0;
    let unclassifiedGames = 0;

    for (const game of games) {
      if (!game.opening) {
        unclassifiedGames++;
        continue;
      }
      
      classifiedGames++;
      
      const key = `${game.opening.eco} - ${game.opening.name}`;
      
      if (!openingStats[key]) {
        openingStats[key] = { eco: game.opening.eco, name: game.opening.name, count: 0, wins: 0, draws: 0, losses: 0 };
      }
      
      openingStats[key].count++;
      if (game.opponentResult === 'win') openingStats[key].wins++;
      else if (game.opponentResult === 'loss') openingStats[key].losses++;
      else if (game.opponentResult === 'draw') openingStats[key].draws++;
    }

    const validStats = Object.values(openingStats).filter(s => s.count >= MIN_GAMES);

    validStats.forEach(s => {
      const decideCount = s.wins + s.losses + s.draws;
      (s as any).scorePercentage = decideCount > 0 ? ((s.wins + 0.5 * s.draws) / decideCount) : 0;
    });

    validStats.sort((a, b) => b.count - a.count);
    const mostFrequent = validStats.slice(0, 5);

    validStats.sort((a, b) => (b as any).scorePercentage - (a as any).scorePercentage);
    const mostSuccessful = validStats.slice(0, 5);
    
    const leastSuccessful = [...validStats].reverse().slice(0, 5);

    // Stage 3: Preferred responses as Black
    const responses: Record<string, Record<string, { count: number, wins: number, draws: number, losses: number, scorePercentage?: number }>> = {
      'e4': {}, 'd4': {}, 'c4': {}, 'Nf3': {}
    };
    
    for (const game of games) {
      if (game.opponentColor !== 'b') continue;
      if (game.moves.length < 2) continue;
      
      const w1 = game.moves[0].san;
      const b1 = game.moves[1].san;
      
      if (responses[w1]) {
        if (!responses[w1][b1]) {
          responses[w1][b1] = { count: 0, wins: 0, draws: 0, losses: 0 };
        }
        responses[w1][b1].count++;
        if (game.opponentResult === 'win') responses[w1][b1].wins++;
        else if (game.opponentResult === 'loss') responses[w1][b1].losses++;
        else if (game.opponentResult === 'draw') responses[w1][b1].draws++;
      }
    }

    const preferredResponses: Record<string, any[]> = {};
    for (const w1 of Object.keys(responses)) {
      const b1Stats = Object.entries(responses[w1])
        .filter(([_, s]) => s.count >= MIN_GAMES)
        .map(([b1, s]) => {
          const decideCount = s.wins + s.losses + s.draws;
          return {
            move: b1,
            ...s,
            scorePercentage: decideCount > 0 ? (s.wins + 0.5 * s.draws) / decideCount : 0
          };
        })
        .sort((a, b) => b.count - a.count);
      preferredResponses[w1] = b1Stats;
    }

    // Stage 3: Lines rarely deviated from (Standard Lines)
    // Threshold: Longest common prefix shared by >= 80% of games in that opening
    const standardLines = [];
    for (const op of mostFrequent) {
      const openingGames = games.filter(g => g.opening && g.opening.eco === op.eco && g.opening.name === op.name);
      if (openingGames.length < MIN_GAMES) continue;

      let maxDepth = 0;
      let standardPrefix: string[] = [];
      let standardCount = openingGames.length;
      
      for (let d = 0; d < 100; d++) {
        const moveCounts: Record<string, number> = {};
        for (const g of openingGames) {
          if (g.moves.length > d) {
             const prefix = g.moves.slice(0, d+1).map(m=>m.san).join(' ');
             moveCounts[prefix] = (moveCounts[prefix] || 0) + 1;
          }
        }
        
        let bestPrefix = '';
        let bestCount = 0;
        for (const [p, c] of Object.entries(moveCounts)) {
           if (c > bestCount) { bestCount = c; bestPrefix = p; }
        }
        
        if (bestCount >= 0.8 * openingGames.length && bestCount > 0) {
           maxDepth = d + 1;
           standardPrefix = bestPrefix.split(' ');
           standardCount = bestCount;
        } else {
           break;
        }
      }
      if (standardPrefix.length > 0) {
        standardLines.push({ 
          opening: op.name, 
          prefix: standardPrefix.join(' '), 
          count: standardCount, 
          totalOpeningGames: openingGames.length,
          percentage: standardCount / openingGames.length 
        });
      }
    }

    // Stage 3: Openings they avoid
    // Curated proxy list of major opening families. This is a heuristic and not based on a real
    // popularity dataset. It should be revisited if we acquire actual opening frequency data.
    const MAJOR_OPENINGS = [
      "Sicilian Defense", "Ruy Lopez", "Italian Game", "French Defense",
      "Caro-Kann Defense", "King's Indian Defense", "Queen's Gambit", "English Opening",
      "Nimzo-Indian Defense", "Scandinavian Defense", "Pirc Defense", "Grünfeld Defense",
      "Alekhine Defense", "Dutch Defense", "Slav Defense", "Queen's Indian Defense",
      "King's Gambit", "Scotch Game", "Modern Defense", "London System",
      "Reti Opening", "Trompowsky Attack", "Vienna Game", "Four Knights Game",
      "Petroff's Defense"
    ];

    let avoidedOpenings: any;
    if (games.length < MIN_GAMES_FOR_AVOIDED_OPENINGS) {
      avoidedOpenings = {
        insufficientData: true,
        minGamesRequired: MIN_GAMES_FOR_AVOIDED_OPENINGS,
        currentGames: games.length
      };
    } else {
      avoidedOpenings = [];
      for (const major of MAJOR_OPENINGS) {
        // Check if they have any game that belongs to this major opening family
        // (ignoring variation suffixes like ": Closed")
        const hasPlayed = games.some(g => g.opening && g.opening.name.startsWith(major));
        if (!hasPlayed) {
          avoidedOpenings.push(major);
        }
      }
    }

    // Stage 3: Underperforming variations
    // Calculate overall average score
    let totalWins = 0, totalLosses = 0, totalDraws = 0;
    for (const g of games) {
      if (g.opponentResult === 'win') totalWins++;
      else if (g.opponentResult === 'loss') totalLosses++;
      else if (g.opponentResult === 'draw') totalDraws++;
    }
    const overallDecideCount = totalWins + totalLosses + totalDraws;
    const overallScore = overallDecideCount > 0 ? (totalWins + 0.5 * totalDraws) / overallDecideCount : 0;

    const variationStats: Record<string, { count: number, wins: number, draws: number, losses: number }> = {};
    for (const g of games) {
      // Look at specific sequences of depth 4 to 12
      for (let d = 4; d <= Math.min(12, g.moves.length); d++) {
        const prefix = g.moves.slice(0, d).map(m=>m.san).join(' ');
        if (!variationStats[prefix]) variationStats[prefix] = { count: 0, wins: 0, draws: 0, losses: 0 };
        variationStats[prefix].count++;
        if (g.opponentResult === 'win') variationStats[prefix].wins++;
        else if (g.opponentResult === 'loss') variationStats[prefix].losses++;
        else if (g.opponentResult === 'draw') variationStats[prefix].draws++;
      }
    }

    const underperformingVariations = Object.entries(variationStats)
      .filter(([_, s]) => s.count >= MIN_GAMES)
      .map(([prefix, s]) => {
        const decideCount = s.wins + s.losses + s.draws;
        return {
          variation: prefix,
          ...s,
          scorePercentage: decideCount > 0 ? (s.wins + 0.5 * s.draws) / decideCount : 0
        };
      })
      // Heuristic: Notably underperforming if >= 10% worse than their overall average
      .filter(s => s.scorePercentage < overallScore - 0.1)
      .sort((a, b) => a.scorePercentage - b.scorePercentage)
      .slice(0, 5);

    // Stage 5: Time Analysis
    let timeAnalysisUsableGames = 0;
    let timeAnalysisUnusableGames = 0;
    let timeTroubleCount = 0;
    let noTimeTroubleCount = 0;
    let ttWins = 0, ttDraws = 0, ttLosses = 0;
    let noTtWins = 0, noTtDraws = 0, noTtLosses = 0;
    let totalRushedCriticalMoves = 0;

    for (const game of games) {
      const tcInfo = parseTimeControl(game.timeControl);
      const hasClocks = game.moves.some(m => m.clock !== undefined);
      
      if (!tcInfo || !hasClocks) {
        timeAnalysisUnusableGames++;
        continue;
      }
      
      timeAnalysisUsableGames++;
      const timeTroubleThreshold = tcInfo.base * 0.15;
      
      let inTimeTrouble = false;
      let totalTimeSpent = 0;
      let moveCount = 0;
      const opponentMovesInfo: { index: number, timeSpent: number }[] = [];

      for (let i = 0; i < game.moves.length; i++) {
        const isOpponentMove = (game.opponentColor === 'w' && i % 2 === 0) || (game.opponentColor === 'b' && i % 2 === 1);
        if (isOpponentMove) {
          const currentClock = game.moves[i].clock;
          if (currentClock !== undefined) {
            if (currentClock < timeTroubleThreshold) {
              inTimeTrouble = true;
            }
            const priorClock = (i < 2) ? tcInfo.base : (game.moves[i - 2].clock ?? tcInfo.base);
            let timeSpent = priorClock + tcInfo.inc - currentClock;
            timeSpent = Math.max(0, timeSpent);
            
            totalTimeSpent += timeSpent;
            moveCount++;
            opponentMovesInfo.push({ index: i, timeSpent });
          }
        }
      }

      if (inTimeTrouble) {
        timeTroubleCount++;
        if (game.opponentResult === 'win') ttWins++;
        else if (game.opponentResult === 'draw') ttDraws++;
        else if (game.opponentResult === 'loss') ttLosses++;
      } else {
        noTimeTroubleCount++;
        if (game.opponentResult === 'win') noTtWins++;
        else if (game.opponentResult === 'draw') noTtDraws++;
        else if (game.opponentResult === 'loss') noTtLosses++;
      }

      const avgTimeSpent = moveCount > 0 ? totalTimeSpent / moveCount : 0;
      const fastThreshold = avgTimeSpent * 0.30;

      if (game.evaluations && game.evaluations.length === game.moves.length + 1) {
        for (const info of opponentMovesInfo) {
          if (info.timeSpent < fastThreshold) {
            const plyBefore = info.index;
            const plyAfter = info.index + 1;
            const evalBefore = game.evaluations[plyBefore]?.evaluationWhitePerspective;
            const evalAfter = game.evaluations[plyAfter]?.evaluationWhitePerspective;
            
            if (evalBefore !== null && evalAfter !== null && evalBefore !== undefined && evalAfter !== undefined) {
              let swing = 0;
              if (game.opponentColor === 'w') {
                swing = evalBefore - evalAfter;
              } else {
                swing = evalAfter - evalBefore;
              }
              if (swing >= 150) {
                totalRushedCriticalMoves++;
              }
            }
          }
        }
      }
    }
    
    const timeAnalysis = {
      usableGames: timeAnalysisUsableGames,
      unusableGames: timeAnalysisUnusableGames,
      timeTrouble: {
        frequency: timeAnalysisUsableGames > 0 ? timeTroubleCount / timeAnalysisUsableGames : 0,
        scorePercentage: (ttWins + ttLosses + ttDraws) > 0 ? (ttWins + 0.5 * ttDraws) / (ttWins + ttLosses + ttDraws) : 0,
      },
      noTimeTrouble: {
        frequency: timeAnalysisUsableGames > 0 ? noTimeTroubleCount / timeAnalysisUsableGames : 0,
        scorePercentage: (noTtWins + noTtLosses + noTtDraws) > 0 ? (noTtWins + 0.5 * noTtDraws) / (noTtWins + noTtLosses + noTtDraws) : 0,
      },
      rushedCriticalMoves: totalRushedCriticalMoves
    };

    // Stage 6: Weakness Detection
    let openingBlunders = 0;
    let middlegameBlunders = 0;
    let endgameBlunders = 0;
    let timeTroubleBlunders = 0;
    let lostWinningPositions = 0;

    const weaknessDetails: any[] = [];

    for (const game of games) {
      if (game.opponentResult !== 'loss' || !game.evaluations) continue;

      let winningStreak = 0;
      let hasLostWinningPosition = false;

      const tcInfo = parseTimeControl(game.timeControl);
      const timeTroubleThreshold = tcInfo ? tcInfo.base * 0.15 : 0;

      for (let i = 0; i < game.moves.length; i++) {
        // First check winning position condition for ANY ply
        const currentEval = game.evaluations[i];
        if (currentEval) {
          const cp = currentEval.evaluationWhitePerspective;
          const mate = currentEval.mateInWhitePerspective;
          
          let isWinning = false;
          if (game.opponentColor === 'w') {
            if ((mate !== null && mate !== undefined && mate > 0) || (cp !== null && cp !== undefined && cp >= 200)) {
              isWinning = true;
            }
          } else {
            if ((mate !== null && mate !== undefined && mate < 0) || (cp !== null && cp !== undefined && cp <= -200)) {
              isWinning = true;
            }
          }

          if (isWinning) {
            // Mate instantly triggers win, cp needs 3 plies
            if ((mate !== null && mate !== undefined) && ((game.opponentColor === 'w' && mate > 0) || (game.opponentColor === 'b' && mate < 0))) {
              hasLostWinningPosition = true;
            } else {
              winningStreak++;
              if (winningStreak >= 3) hasLostWinningPosition = true;
            }
          } else {
            winningStreak = 0;
          }
        }

        // Now check for mistakes/blunders on THEIR moves
        const isOpponentMove = (game.opponentColor === 'w' && i % 2 === 0) || (game.opponentColor === 'b' && i % 2 === 1);
        if (isOpponentMove) {
          const evalBefore = game.evaluations[i]?.evaluationWhitePerspective;
          const evalAfter = game.evaluations[i + 1]?.evaluationWhitePerspective;
          
          if (evalBefore !== null && evalAfter !== null && evalBefore !== undefined && evalAfter !== undefined) {
             let swing = 0;
             if (game.opponentColor === 'w') {
               swing = evalBefore - evalAfter;
             } else {
               swing = evalAfter - evalBefore;
             }

             if (swing >= 150) {
                const fenBefore = game.evaluations[i].fen;
                const phase = getPhase(fenBefore, i);
                
                if (phase === 'opening') openingBlunders++;
                else if (phase === 'middlegame') middlegameBlunders++;
                else if (phase === 'endgame') endgameBlunders++;

                let priorClock: number | undefined;
                if (i < 2) {
                  priorClock = tcInfo ? tcInfo.base : undefined;
                } else {
                  priorClock = game.moves[i - 2].clock;
                  if (priorClock === undefined) priorClock = tcInfo ? tcInfo.base : undefined;
                }

                let inTimeTrouble = false;
                if (priorClock !== undefined && priorClock < timeTroubleThreshold) {
                  inTimeTrouble = true;
                  timeTroubleBlunders++;
                }

                weaknessDetails.push({
                   pgnHash: game.pgnHash,
                   ply: i,
                   phase,
                   severity: swing >= 300 ? 'blunder' : 'mistake',
                   swing,
                   evalBefore,
                   evalAfter,
                   inTimeTrouble
                });
             }
          }
        }
      }

      if (hasLostWinningPosition) {
        lostWinningPositions++;
      }
    }

    const weaknesses = {
      openingBlunders,
      middlegameBlunders,
      endgameBlunders,
      timeTroubleBlunders,
      lostWinningPositions,
      details: weaknessDetails
    };

    return {
      totalGames: games.length,
      classifiedGames,
      unclassifiedGames,
      threshold: MIN_GAMES,
      overallScorePercentage: overallScore,
      mostFrequent,
      mostSuccessful,
      leastSuccessful,
      preferredResponses,
      standardLines,
      avoidedOpenings,
      underperformingVariations,
      timeAnalysis,
      weaknesses
    };
  }
};
