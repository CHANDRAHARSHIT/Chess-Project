import { prisma } from "../core/database/prisma.js";

export interface PathwayProgressData {
  completedIds: string[];
  streak: number;
  totalSolved: number;
}

/**
 * PathwayProgressService
 * ----------------------
 * Handles reading and writing pathway puzzle progress records.
 * Each user has at most one PathwayProgress row (userId is unique).
 */
export class PathwayProgressService {
  /**
   * Fetch progress for a user.
   * Returns a default empty-progress object if no record exists yet.
   */
  static async getProgress(userId: string): Promise<PathwayProgressData> {
    const record = await prisma.pathwayProgress.findUnique({
      where: { userId },
      select: { completedIds: true, streak: true, totalSolved: true },
    });

    if (!record) {
      return { completedIds: [], streak: 0, totalSolved: 0 };
    }

    return {
      completedIds: record.completedIds,
      streak: record.streak,
      totalSolved: record.totalSolved,
    };
  }

  /**
   * Upsert progress for a user.
   * Creates the record on first call, updates it on subsequent calls.
   */
  static async upsertProgress(
    userId: string,
    data: PathwayProgressData
  ): Promise<PathwayProgressData> {
    const record = await prisma.pathwayProgress.upsert({
      where: { userId },
      create: {
        userId,
        completedIds: data.completedIds,
        streak: data.streak,
        totalSolved: data.totalSolved,
      },
      update: {
        completedIds: data.completedIds,
        streak: data.streak,
        totalSolved: data.totalSolved,
      },
      select: { completedIds: true, streak: true, totalSolved: true },
    });

    return {
      completedIds: record.completedIds,
      streak: record.streak,
      totalSolved: record.totalSolved,
    };
  }
}
