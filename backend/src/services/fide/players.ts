/**
 * players.ts
 * Loads and queries the player alias table from data/players.json.
 * Maps FIDE ID → canonical name + known aliases/spelling variants.
 */

import fs from 'fs';
import path from 'path';

export interface PlayerEntry {
  fide_id: number;
  canonical_name: string;
  aliases: string[];
}

const PLAYERS_FILE = path.join(process.cwd(), 'data', 'players.json');

let playersCache: PlayerEntry[] | null = null;

export function loadPlayers(): PlayerEntry[] {
  if (playersCache) return playersCache;

  if (!fs.existsSync(PLAYERS_FILE)) {
    throw new Error(`Player alias table not found at ${PLAYERS_FILE}. Create data/players.json first.`);
  }

  const raw = fs.readFileSync(PLAYERS_FILE, 'utf-8');
  playersCache = JSON.parse(raw) as PlayerEntry[];
  return playersCache;
}

export function findPlayerByFideId(fideId: number): PlayerEntry | null {
  const players = loadPlayers();
  return players.find(p => p.fide_id === fideId) || null;
}
