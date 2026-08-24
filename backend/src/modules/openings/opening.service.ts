import { prisma } from "../../core/database/prisma.js";

export class OpeningService {
  /**
   * Retrieves all chess openings stored in the database.
   */
  static async getAllOpenings() {
    return await prisma.opening.findMany({
      orderBy: { eco: "asc" },
    });
  }

  /**
   * Retrieves a single chess opening by its unique database ID.
   */
  static async getOpeningById(id: string) {
    return await prisma.opening.findUnique({
      where: { id },
    });
  }
}
