/**
 * DB↔domain boundary for compensation.
 *
 * Uniqueness is enforced by two partial unique indexes that Prisma cannot express
 * (see the migration), so a repeat insert throws P2002 rather than upserting. That
 * throw is caught here and read as "already compensated" — the guarantee lives in
 * the database, the ergonomics here.
 */

import type {
  CompensationRecord as CompensationRecordRow,
  Prisma,
} from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import type { AffectedUser, CompensationKind, CompensationRecord } from "../types.js";

export interface NewCompensationInput {
  readonly userId: string;
  readonly caseId: string;
  readonly kind: CompensationKind;
  readonly gameRecordId?: string;
  readonly ratingPointsRestored?: number;
  readonly notes?: string;
}

export interface CompensationRepository {
  /** Returns the existing record instead of writing a second one. */
  saveCompensation(input: NewCompensationInput): Promise<CompensationRecord>;
  findCompensationHistory(userId: string): Promise<readonly CompensationRecord[]>;
  findOpponentsInGames(
    gameRecordIds: readonly string[],
    suspectUserId: string
  ): Promise<readonly AffectedUser[]>;
}

/** Takes a client so callers can run inside a `$transaction`. */
export function createPrismaCompensationRepository(
  client: Prisma.TransactionClient = prisma
): CompensationRepository {
  return {
    async saveCompensation(input: NewCompensationInput): Promise<CompensationRecord> {
      try {
        const row = await client.compensationRecord.create({
          data: {
            userId: input.userId,
            caseId: input.caseId,
            kind: input.kind,
            gameRecordId: input.gameRecordId ?? null,
            ratingPointsRestored: input.ratingPointsRestored ?? null,
            notes: input.notes ?? null,
          },
        });
        return buildCompensationRecord(row);
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;

        const existing = await client.compensationRecord.findFirst({
          where: {
            caseId: input.caseId,
            userId: input.userId,
            kind: input.kind,
            gameRecordId: input.gameRecordId ?? null,
          },
        });
        if (!existing) throw error;
        return buildCompensationRecord(existing);
      }
    },

    async findCompensationHistory(userId: string): Promise<readonly CompensationRecord[]> {
      const rows = await client.compensationRecord.findMany({
        where: { userId },
        orderBy: { issuedAt: "desc" },
      });
      return rows.map(buildCompensationRecord);
    },

    async findOpponentsInGames(
      gameRecordIds: readonly string[],
      suspectUserId: string
    ): Promise<readonly AffectedUser[]> {
      if (gameRecordIds.length === 0) return [];

      const participants = await client.gameParticipant.findMany({
        where: {
          gameRecordId: { in: [...gameRecordIds] },
          userId: { not: suspectUserId },
        },
        select: { userId: true, gameRecordId: true, ratingDelta: true },
        orderBy: [{ gameRecordId: "asc" }, { userId: "asc" }],
      });

      return participants.map((participant) => ({
        userId: participant.userId,
        gameRecordId: participant.gameRecordId,
        // Null until rated play exists — see blocker 1.
        ...(participant.ratingDelta !== null && participant.ratingDelta < 0
          ? { ratingPointsLost: Math.abs(participant.ratingDelta) }
          : {}),
      }));
    },
  };
}

export const prismaCompensationRepository: CompensationRepository =
  createPrismaCompensationRepository();

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002"
  );
}

function buildCompensationRecord(row: CompensationRecordRow): CompensationRecord {
  return {
    compensationId: row.id,
    userId: row.userId,
    caseId: row.caseId,
    kind: row.kind as CompensationKind,
    ...(row.gameRecordId ? { gameRecordId: row.gameRecordId } : {}),
    ...(row.ratingPointsRestored !== null
      ? { ratingPointsRestored: row.ratingPointsRestored }
      : {}),
    ...(row.amountMinorUnits !== null ? { amountMinorUnits: row.amountMinorUnits } : {}),
    ...(row.currency ? { currency: row.currency } : {}),
    issuedAt: row.issuedAt,
    ...(row.notes ? { notes: row.notes } : {}),
  };
}
