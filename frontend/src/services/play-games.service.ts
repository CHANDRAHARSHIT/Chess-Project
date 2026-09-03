/**
 * games.service.ts
 * Read-only HTTP client for GET /api/games/history/me and /api/games/leaderboard/:variantId.
 */
import { MultiplayerDisabledError } from "@/services/play-matchmaking.service";

export interface GameHistoryEntry {
  id: string;
  gameRecordId: string;
  userId: string;
  side: number;
  result: "WIN" | "LOSS" | "DRAW";
  ratingBefore: number | null;
  ratingAfter: number | null;
  ratingDelta: number | null;
  gameRecord: {
    id: string;
    variantId: string;
    rated: boolean;
    outcomeKind: "win" | "draw";
    terminationReason: string;
    moveCount: number;
    endedAt: string;
    timeControlLabel: string | null;
  };
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  variantId: string;
  rating: number;
  gamesPlayed: number;
  user: { id: string; name: string | null; image: string | null };
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (res.status === 503) throw new MultiplayerDisabledError();
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request to ${url} failed.`);
  }
  return res.json();
}

export class GamesService {
  static async getHistory(): Promise<GameHistoryEntry[]> {
    const body = await getJson<{ data: { history: GameHistoryEntry[] } }>("/api/games/history/me");
    return body.data.history;
  }

  static async getLeaderboard(variantId: string): Promise<LeaderboardEntry[]> {
    const body = await getJson<{ data: { leaderboard: LeaderboardEntry[] } }>(
      `/api/games/leaderboard/${variantId}`
    );
    return body.data.leaderboard;
  }
}
