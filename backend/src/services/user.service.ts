import { prisma } from "../config/prisma.js";

export class UserService {
  /**
   * Retrieves a user by their unique database ID, including associated OAuth accounts.
   */
  static async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        accounts: {
          select: {
            provider: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            product: {
              include: {
                features: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Retrieves a user by their unique email address.
   */
  static async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Retrieves a list of users for leaderboard rankings.
   * Currently acts as a placeholder returning the most recently registered users.
   */
  static async getLeaderboard(limit = 10) {
    return await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
      },
    });
  }

  /**
   * Invalidate and delete all database sessions for the specified user ID.
   */
  static async logoutAll(userId: string) {
    return await prisma.session.deleteMany({
      where: { userId },
    });
  }
}
