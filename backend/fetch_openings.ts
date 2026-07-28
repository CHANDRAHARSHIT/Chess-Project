import fs from 'fs';
import path from 'path';
import { Chess } from 'chess.js';

const DATA_FILE = path.join(process.cwd(), 'data', 'ecoOpenings.json');

async function fetchAndConvertOpenings() {
  const files = ['a.tsv', 'b.tsv', 'c.tsv', 'd.tsv', 'e.tsv'];
  const baseUrl = "https://raw.githubusercontent.com/lichess-org/chess-openings/master/";
  const openings = [];

  for (const file of files) {
    console.log(`Fetching ${file}...`);
    const response = await fetch(baseUrl + file);
    if (!response.ok) {
      console.error(`Failed to fetch ${file}`);
      continue;
    }
    const text = await response.text();
    const lines = text.split('\n');
    
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [eco, name, pgn] = line.split('\t');
      
      const chess = new Chess();
      try {
        chess.loadPgn(pgn);
        const moves = chess.history({ verbose: true }).map(m => m.san);
        openings.push({ eco, name, moves });
      } catch (err) {
        console.error(`Failed to parse PGN for ${name}: ${pgn}`);
      }
    }
  }

  // Ensure data directory exists
  if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(openings, null, 2), 'utf-8');
  console.log(`Successfully saved ${openings.length} openings to ecoOpenings.json`);
}

fetchAndConvertOpenings().catch(console.error);
