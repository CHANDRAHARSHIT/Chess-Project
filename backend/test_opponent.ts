import { OpponentService } from './src/services/opponent.service.js';
import { EngineService } from './src/services/engine.service.js';

const pgn1 = `
[Event "Speed Chess Championship"]
[Site "Chess.com"]
[Date "2024.09.08"]
[Round "Final"]
[White "Nakamura, Hikaru"]
[Black "Firouzja, Alireza"]
[Result "1/2-1/2"]
[WhiteElo "2802"]
[BlackElo "2759"]
[TimeControl "180+1"]

1. e4 {[%clk 0:03:00]} e5 {[%clk 0:02:59]} 2. Nf3 {[%clk 0:02:58]} Nc6 {[%clk 0:02:57]} 3. Bb5 {[%clk 0:02:56]} a6 {[%clk 0:02:55]} 4. Ba4 {[%clk 0:02:54]} Nf6 {[%clk 0:02:53]} 5. O-O {[%clk 0:02:52]} Be7 {[%clk 0:02:51]} 6. Re1 {[%clk 0:02:50]} b5 {[%clk 0:02:49]} 7. Bb3 {[%clk 0:02:48]} O-O {[%clk 0:02:47]}
8. c3 {[%clk 0:02:46]} d6 {[%clk 0:02:45]} 9. h3 {[%clk 0:02:44]} Na5 {[%clk 0:02:43]} 10. Bc2 {[%clk 0:02:42]} c5 {[%clk 0:02:41]} 11. d4 {[%clk 0:02:40]} Qc7 {[%clk 0:02:39]} 12. Nbd2 {[%clk 0:02:38]} cxd4 {[%clk 0:00:25]} 13. cxd4 {[%clk 0:02:36]} Bb7 {[%clk 0:00:15]} 14. d5 {[%clk 0:02:34]} Rac8 {[%clk 0:00:12]}
15. Bd3 {[%clk 0:02:32]} Nd7 {[%clk 0:00:10]} 16. b4 {[%clk 0:02:30]} Nc4 {[%clk 0:00:08]} 17. Nxc4 {[%clk 0:02:28]} bxc4 {[%clk 0:00:05]} 18. Bc2 {[%clk 0:02:26]} 1/2-1/2
`;

const pgn2 = pgn1.replace('2024.09.08', '2024.09.09').replace('1/2-1/2', '1-0').replace('1/2-1/2', '1-0');
const pgn3 = pgn1.replace('2024.09.08', '2024.09.10').replace('1/2-1/2', '0-1').replace('1/2-1/2', '0-1');
const pgn4 = pgn1.replace('2024.09.08', '2024.09.11').replace('1/2-1/2', '1-0').replace('1/2-1/2', '1-0');
// opponentResult: 
// pgn1: 1/2-1/2 -> draw
// pgn2: 1-0 -> loss (White wins, opponent is Black)
// pgn3: 0-1 -> win (Black wins, opponent is Black)
// pgn4: 1-0 -> loss

const res = OpponentService.ingestGames("Firouzja", [pgn1, pgn2, pgn3, pgn4]);
console.log("Ingestion result:", res);

OpponentService.backfillOpenings();
console.log("Backfill completed.");

const games = OpponentService.getGames("Firouzja");
console.log("\nSample classified game opening:");
console.log(games[games.length - 1].opening);

async function runEval() {
  console.log("\nRunning backfill for clocks and evaluations...");
  await OpponentService.backfillClocksAndEvals();
  console.log("Backfill completed.");

  const stats = OpponentService.getStats("Firouzja");
  console.log("\nTime Analysis Output:");
  console.log(JSON.stringify(stats.timeAnalysis, null, 2));

  console.log("\nStage 6: Weaknesses Output:");
  console.log(JSON.stringify(stats.weaknesses, null, 2));

  // console.log("\nEvaluating first 5 positions of the game...");
  // const firstGameMoves = games[0].moves.slice(0, 5); // Just 5 plies for the test
  // const evalResults = await EngineService.evaluateGame(firstGameMoves);
  // console.log(JSON.stringify(evalResults, null, 2));
  process.exit(0);
}
runEval();
