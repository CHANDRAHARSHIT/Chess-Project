/**
 * DB↔domain boundary for applied penalties. Expiry is a read-time comparison,
 * never a stored flag — nothing sweeps this table.
 */

import type { AppliedPenalty as AppliedPenaltyRow } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import type { AppliedPenalty, EscalationLevel, PenaltyAction, Situation } from "../types.js";

export interface NewPenaltyInput {
  readonly userId: string;
  readonly caseId: string;
  readonly action: PenaltyAction;
  readonly level: EscalationLevel;
  readonly situation: Situation;
  readonly expiresAt: Date | null;
}

export interface PenaltyRepository {
  savePenalty(input: NewPenaltyInput): Promise<AppliedPenalty>;
  findPenaltyById(penaltyId: string): Promise<AppliedPenalty | null>;
  /** Unreversed and unexpired, newest first. */
  findActivePenalties(userId: string): Promise<readonly AppliedPenalty[]>;
  findPenaltyHistory(userId: string): Promise<readonly AppliedPenalty[]>;
  reversePenalty(penaltyId: string, reason: string): Promise<AppliedPenalty>;
}

export const prismaPenaltyRepository: PenaltyRepository = {
  async savePenalty(input: NewPenaltyInput): Promise<AppliedPenalty> {
    const row = await prisma.appliedPenalty.create({
      data: {
        userId: input.userId,
        caseId: input.caseId,
        action: input.action,
        level: input.level,
        proficiency: input.situation.proficiency,
        eventType: input.situation.eventType,
        expiresAt: input.expiresAt,
      },
    });
    return buildAppliedPenalty(row);
  },

  async findPenaltyById(penaltyId: string): Promise<AppliedPenalty | null> {
    const row = await prisma.appliedPenalty.findUnique({ where: { id: penaltyId } });
    return row ? buildAppliedPenalty(row) : null;
  },

  async findActivePenalties(userId: string): Promise<readonly AppliedPenalty[]> {
    const rows = await prisma.appliedPenalty.findMany({
      where: {
        userId,
        reversed: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { appliedAt: "desc" },
    });
    return rows.map(buildAppliedPenalty);
  },

  async findPenaltyHistory(userId: string): Promise<readonly AppliedPenalty[]> {
    const rows = await prisma.appliedPenalty.findMany({
      where: { userId },
      orderBy: { appliedAt: "desc" },
    });
    return rows.map(buildAppliedPenalty);
  },

  async reversePenalty(penaltyId: string, reason: string): Promise<AppliedPenalty> {
    const row = await prisma.appliedPenalty.update({
      where: { id: penaltyId },
      data: { reversed: true, reversedAt: new Date(), reversalReason: reason },
    });
    return buildAppliedPenalty(row);
  },
};

function buildAppliedPenalty(row: AppliedPenaltyRow): AppliedPenalty {
  return {
    penaltyId: row.id,
    userId: row.userId,
    action: row.action as PenaltyAction,
    level: row.level as EscalationLevel,
    situation: {
      proficiency: row.proficiency as Situation["proficiency"],
      eventType: row.eventType as Situation["eventType"],
    },
    appliedAt: row.appliedAt,
    ...(row.expiresAt ? { expiresAt: row.expiresAt } : {}),
    caseId: row.caseId,
    reversed: row.reversed,
  };
}
