import { Request, Response } from 'express';
import { OpponentService } from '../services/opponent.service.js';
import { EngineService } from '../services/engine.service.js';
import { Chess } from 'chess.js';

export const OpponentController = {
  ingestGames: (req: Request, res: Response) => {
    try {
      const { username, pgns } = req.body;

      if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: 'Valid username is required' });
      }

      if (!Array.isArray(pgns)) {
        return res.status(400).json({ error: 'pgns must be an array of strings' });
      }

      const result = OpponentService.ingestGames(username, pgns);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in OpponentController.ingestGames:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  getGames: (req: Request, res: Response) => {
    try {
      const { username } = req.params;

      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      const games = OpponentService.getGames(username);
      return res.status(200).json({ games });
    } catch (error) {
      console.error('Error in OpponentController.getGames:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  getReport: async (req: Request, res: Response) => {
    try {
      const { username } = req.params;

      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      const stats = OpponentService.getStats(username);
      const allGames = OpponentService.getGames(username);
      
      const gamesAsWhite = allGames.filter((g: any) => g.opponentColor === 'w');
      const gamesAsBlack = allGames.filter((g: any) => g.opponentColor === 'b');

      // Helper function to extract worst performing openings
      const rankRecommendedOpenings = async (gamesList: any[], isWeWhite: boolean) => {
        if (gamesList.length === 0) return [];
        const totalGamesForColor = gamesList.length;
        
        // Group games by opening
        const openingGames: Record<string, any[]> = {};
        for (const g of gamesList) {
          if (!g.opening || !g.opening.name) continue;
          const key = g.opening.name;
          if (!openingGames[key]) openingGames[key] = [];
          openingGames[key].push(g);
        }
        
        const validRecommendations: any[] = [];
        
        for (const [variationName, groupGames] of Object.entries(openingGames)) {
          if (groupGames.length < 3) continue; // MIN_GAMES threshold
          
          let wins = 0, draws = 0, losses = 0;
          for (const g of groupGames) {
            if (g.opponentResult === 'win') wins++;
            else if (g.opponentResult === 'loss') losses++;
            else if (g.opponentResult === 'draw') draws++;
          }
          const scorePercentage = (wins + 0.5 * draws) / groupGames.length;
          
          // 1. S_freq (Weight: 0.25)
          const sFreq = groupGames.length / totalGamesForColor;
          
          // 2. S_unfamiliar (Weight: 0.20)
          const sUnfamiliar = 1.0 - sFreq;
          
          // Compute standard line for this variation (longest prefix shared by >80%)
          let maxDepth = 0;
          let standardCount = groupGames.length;
          for (let d = 0; d < 100; d++) {
            const moveCounts: Record<string, number> = {};
            for (const g of groupGames) {
              if (g.moves.length > d) {
                const prefix = g.moves.slice(0, d + 1).map((m: any) => m.san).join(' ');
                moveCounts[prefix] = (moveCounts[prefix] || 0) + 1;
              }
            }
            let bestCount = 0;
            for (const c of Object.values(moveCounts)) {
              if (c > bestCount) bestCount = c;
            }
            if (bestCount >= 0.8 * groupGames.length && bestCount > 0) {
              maxDepth = d + 1;
              standardCount = bestCount;
            } else {
              break;
            }
          }
          
          const d = maxDepth; // The ply where the standard line ends (0-indexed)
          
          // 3. S_eval (Weight: 0.40)
          let totalEvalForUs = 0;
          let validEvalCount = 0;
          let commonBestMove: string | null = null;
          let targetFen: string | null = null;
          const bestMoveCounts: Record<string, number> = {};
          
          // Determine the ply where it's actually our turn to extract the best move
          const isOurTurnAtD = isWeWhite ? (d % 2 === 0) : (d % 2 !== 0);
          const targetPlyForMove = isOurTurnAtD ? d : d + 1;
          
          for (const g of groupGames) {
            if (g.evaluations && g.evaluations.length > d) {
              const evalPoint = g.evaluations[d];
              let evalForUs = 0;
              if (evalPoint.mateInWhitePerspective !== null) {
                const mateSign = evalPoint.mateInWhitePerspective > 0 ? 1 : -1;
                evalForUs = isWeWhite ? (mateSign * 10000) : (-mateSign * 10000);
              } else if (evalPoint.evaluationWhitePerspective !== null) {
                evalForUs = isWeWhite ? evalPoint.evaluationWhitePerspective : -evalPoint.evaluationWhitePerspective;
              }
              
              totalEvalForUs += evalForUs;
              validEvalCount++;
              
              // Extract bestMove from targetPlyForMove
              if (g.evaluations.length > targetPlyForMove) {
                const moveEvalPoint = g.evaluations[targetPlyForMove];
                if (!targetFen) targetFen = moveEvalPoint.fen;
                if (moveEvalPoint.bestMove) {
                  bestMoveCounts[moveEvalPoint.bestMove] = (bestMoveCounts[moveEvalPoint.bestMove] || 0) + 1;
                }
              }
            }
          }
          
          let avgEvalForUs = validEvalCount > 0 ? totalEvalForUs / validEvalCount : 0;
          let sEval = Math.max(0, Math.min(1, (avgEvalForUs / 300) + 0.5));
          
          let bestMoveCount = 0;
          for (const [m, c] of Object.entries(bestMoveCounts)) {
             if (c > bestMoveCount) { bestMoveCount = c; commonBestMove = m; }
          }
          
          // Base score without S_diff for pre-ranking
          const baseScore = (0.25 * sFreq) + (0.20 * sUnfamiliar) + (0.40 * sEval);
          
          validRecommendations.push({
            variation: variationName,
            eco: groupGames[0].opening.eco,
            name: groupGames[0].opening.name,
            count: groupGames.length,
            wins, draws, losses,
            scorePercentage,
            playProbability: sFreq,
            expectedEval: validEvalCount > 0 ? avgEvalForUs / 100 : null,
            bestMove: commonBestMove,
            targetFen,
            sFreq, sUnfamiliar, sEval, baseScore
          });
        }
        
        // Sort by baseScore and take Top 10 to avoid excessive engine evaluation
        const top10 = validRecommendations.sort((a: any, b: any) => b.baseScore - a.baseScore).slice(0, 10);
        
        // For each top 10, calculate Human Difficulty Rating (1-10) using MultiPV
        for (const rec of top10) {
          let difficulty = 1.0; // Default
          if (rec.targetFen) {
            let multiPvResults = OpponentService.getMultiPvCache(rec.targetFen);
            if (!multiPvResults) {
               multiPvResults = await EngineService.evaluatePositionMultiPv(rec.targetFen, 3);
               if (multiPvResults.length > 0) {
                 OpponentService.setMultiPvCache(rec.targetFen, multiPvResults);
               }
            }
            
            if (multiPvResults && multiPvResults.length > 0) {
              const pvs = multiPvResults;
              // Extract E_i in pawns for the side to move
              const evals = pvs.map((pv: any) => {
                if (pv.mateIn !== null) {
                  return pv.mateIn > 0 ? 10.0 : -10.0;
                }
                return (pv.evaluation || 0) / 100;
              });
              
              const E1 = evals[0];
              const bestMove = pvs[0].move;
              
              // Narrowness
              let goodEnoughCount = 0;
              for (const e of evals) {
                 if (E1 - e <= 0.50) goodEnoughCount++;
              }
              
              let baseScore = 1;
              if (pvs.length === 1) {
                baseScore = 1; // Only 1 legal move, forced
              } else if (goodEnoughCount >= 3 || goodEnoughCount === pvs.length) {
                baseScore = 1;
              } else if (goodEnoughCount === 2) {
                baseScore = 4;
              } else if (goodEnoughCount === 1) {
                const E2 = evals.length > 1 ? evals[1] : E1;
                const drop = E1 - E2;
                baseScore = 4 + Math.min(4.0, drop);
              }
              
              // Salience Adjustment
              // Note: A known v1 limitation is that genuine sacrifices (which are captures) 
              // will be mislabeled as "easy" forcing moves. This will be addressed in future iterations.
              let isForcing = false;
              let hangingMajorAdjustment = 0;
              if (bestMove) {
                 try {
                   const chess = new Chess(rec.targetFen);
                   const moveObj = chess.move(bestMove, { strict: false });
                   if (moveObj && (moveObj.captured || moveObj.san.includes('+') || moveObj.san.includes('#'))) {
                     isForcing = true;
                   }
                   
                   // New: Check if it's capturing a hanging piece
                   if (moveObj && (moveObj.captured === 'q' || moveObj.captured === 'r')) {
                     // Can the opponent recapture on the exact same square?
                     const opponentMoves = chess.moves({ verbose: true });
                     const canRecapture = opponentMoves.some((m: any) => m.to === moveObj.to);
                     
                     if (!canRecapture) {
                        hangingMajorAdjustment = moveObj.san.includes('+') ? -7 : -5;
                     }
                   }
                 } catch(e) { }
              }
              
              const adjustment = isForcing ? 0 : 2;
              difficulty = baseScore + adjustment + hangingMajorAdjustment;
              
              // Cap 1-10
              difficulty = Math.max(1, Math.min(10, Math.round(difficulty)));
            }
          }
          
          rec.humanDifficulty = difficulty;
          const sDiff = difficulty / 10.0;
          rec.compositeScore = rec.baseScore + (0.15 * sDiff);
        }
        
        // Final Sort
        const finalRanked = top10.sort((a: any, b: any) => b.compositeScore - a.compositeScore).slice(0, 3);
        
        // Strip out intermediate scoring fields
        return finalRanked.map((r: any) => ({
          variation: r.variation,
          eco: r.eco,
          name: r.name,
          count: r.count,
          wins: r.wins,
          draws: r.draws,
          losses: r.losses,
          scorePercentage: r.scorePercentage,
          compositeScore: r.compositeScore,
          playProbability: r.playProbability,
          expectedEval: r.expectedEval,
          bestMove: r.bestMove,
          humanDifficulty: r.humanDifficulty
        }));
      };

      // If opponent is Black, we play White, so these are recommendationsAsWhite
      const recommendationsAsWhite = await rankRecommendedOpenings(gamesAsBlack, true);
      // If opponent is White, we play Black, so these are recommendationsAsBlack
      const recommendationsAsBlack = await rankRecommendedOpenings(gamesAsWhite, false);

      return res.status(200).json({
        ...stats,
        recommendationsAsWhite,
        recommendationsAsBlack
      });
    } catch (error) {
      console.error('Error in OpponentController.getReport:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};
