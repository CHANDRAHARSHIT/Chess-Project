import fs from 'fs';
import { OpponentService } from './src/services/opponent.service.js';

// Clear out old games to ensure a clean run
fs.writeFileSync('./data/opponentGames.json', '{}');

async function run() {
    console.log("Fetching real games from Lichess...");
    const res = await fetch("https://lichess.org/api/games/user/Zhigalko_Sergei?max=15&clocks=true");
    const pgnsStr = await res.text();
    
    // Split PGNs robustly by [Event header
    const games = pgnsStr.split(/(?=\[Event ")/g).filter(g => g.trim().length > 0);
    console.log(`Fetched ${games.length} games.`);
    
    console.log("Ingesting games...");
    // Zhigalko_Sergei is the username
    OpponentService.ingestGames("Zhigalko_Sergei", games);
    
    console.log("Running backfill (evaluations + clocks) [This might take ~2 mins for 20 games]...");
    await OpponentService.backfillClocksAndEvals();
    
    console.log("Getting stats...");
    const stats = OpponentService.getStats("Zhigalko_Sergei");
    console.log("\n==================== FULL OUTPUT ====================");
    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
}
run();
