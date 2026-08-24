import { prisma } from "../core/database/prisma.js";

const DEFAULT_LIST_LIMIT = 20;

/** Provisional players (few rated games) are excluded from the public leaderboard — see m4_implementation_plan.md §2. */
const LEADERBOARD_MIN_GAMES_PLAYED = 5;

export class GamesService {
  /**
   * Retrieves a user's game history (most recent first), one row per game they participated in.
   */
  static async getGameHistory(userId: string, limit = DEFAULT_LIST_LIMIT) {
    return await prisma.gameParticipant.findMany({
      where: { userId },
      orderBy: { gameRecord: { endedAt: "desc" } },
      take: limit,
      include: { gameRecord: true },
    });
  }

  /**
   * Retrieves a single finished game record, including all participants.
   */
  static async getGameById(id: string) {
    return await prisma.gameRecord.findUnique({
      where: { id },
      include: { participants: true },
    });
  }

  /**
   * Retrieves the top-rated players for a variant, excluding provisional accounts.
   */
  static async getLeaderboard(variantId: string, limit = DEFAULT_LIST_LIMIT) {
    return await prisma.playerRating.findMany({
      where: { variantId, gamesPlayed: { gte: LEADERBOARD_MIN_GAMES_PLAYED } },
      orderBy: { rating: "desc" },
      take: limit,
      include: { user: { select: { id: true, name: true, image: true } } },
    });
  }
}
